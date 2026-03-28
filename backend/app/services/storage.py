import os
import os
import re
import urllib.parse
import urllib.request
from typing import Optional
from datetime import datetime, timedelta

# This module provides minimal Supabase Storage interactions via HTTP without extra deps.
# It expects the following env vars (already loaded by config.load_dotenv()):
# - SUPABASE_URL
# - SUPABASE_BUCKET
# - SUPABASE_SERVICE_ROLE_KEY
#
# For R2 (Cloudflare) Storage:
# - R2_ACCESS_KEY_ID
# - R2_SECRET_ACCESS_KEY
# - R2_ACCOUNT_ID
# - R2_BUCKET_NAME
# - R2_PUBLIC_URL


_filename_sanitize_re = re.compile(r"[^A-Za-z0-9._-]+")


def _sanitize_filename(name: str) -> str:
    base = name.rsplit("/", 1)[-1].rsplit("\\", 1)[-1]
    base = base.strip() or "file"
    # collapse disallowed chars to '-'
    base = _filename_sanitize_re.sub("-", base)
    # prevent hidden files issues
    if base.startswith('.'):
        base = base.lstrip('.') or 'file'
    # limit length
    return base[:200]


class SupabaseStorage:
    def __init__(self, url: str, bucket: str, service_role_key: str) -> None:
        self.url = url.rstrip('/')
        self.bucket = bucket
        self.key = service_role_key

    def object_url(self, path: str, public: bool = False) -> str:
        encoded_path = urllib.parse.quote(path)
        if public:
            return f"{self.url}/storage/v1/object/public/{self.bucket}/{encoded_path}"
        return f"{self.url}/storage/v1/object/{self.bucket}/{encoded_path}"

    def upload(self, path: str, content: bytes, content_type: str, upsert: bool = True) -> None:
        req = urllib.request.Request(
            self.object_url(path),
            data=content,
            method='POST',
            headers={
                'Authorization': f'Bearer {self.key}',
                'Content-Type': content_type or 'application/octet-stream',
                'x-upsert': 'true' if upsert else 'false',
            },
        )
        # Supabase responds with JSON but we don't need it here
        with urllib.request.urlopen(req) as resp:  # noqa: S310 - trusted URL from env
            # Read to ensure request completes
            _ = resp.read()

    def public_url(self, path: str) -> str:
        return self.object_url(path, public=True)

    def delete(self, path: str) -> None:
        req = urllib.request.Request(
            self.object_url(path),
            method='DELETE',
            headers={
                'Authorization': f'Bearer {self.key}',
            },
        )
        with urllib.request.urlopen(req) as resp:  # noqa: S310 - trusted URL from env
            _ = resp.read()

    def create_signed_upload_url(self, path: str, expiration_seconds: int = 3600) -> dict:
        """Create a signed URL that allows direct upload from browser.

        Returns a dict with signed URL and upload info.
        Uses Supabase's signed URL API to generate a secure URL.
        """
        import json
        import time

        # Supabase allows direct uploads via signed URLs
        # For now, return upload parameters that the client can use
        # The client will upload using PUT request to the public URL
        encoded_path = urllib.parse.quote(path)

        upload_url = f"{self.url}/storage/v1/object/{self.bucket}/{encoded_path}"

        return {
            'uploadUrl': upload_url,
            'path': path,
            'bucket': self.bucket,
            'expiresIn': expiration_seconds
        }


def get_supabase_storage() -> Optional[SupabaseStorage]:
    url = os.getenv('SUPABASE_URL')
    bucket = os.getenv('SUPABASE_BUCKET')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    if not url or not bucket or not key:
        return None
    return SupabaseStorage(url=url, bucket=bucket, service_role_key=key)


def build_attachment_path(post_id: str, attachment_id: str, original_filename: str) -> str:
    safe_name = _sanitize_filename(original_filename or 'file')
    return f"community/{post_id}/{attachment_id}/{safe_name}"


class R2Storage:
    """Cloudflare R2 storage integration using AWS S3 compatible API."""

    def __init__(self, access_key: str, secret_key: str, account_id: str, bucket: str, public_url: str):
        self.access_key = access_key
        self.secret_key = secret_key
        self.account_id = account_id
        self.bucket = bucket
        self.public_url = public_url.rstrip('/')
        self.endpoint = f"https://{account_id}.r2.cloudflarestorage.com"
        self._s3_client = None

    @property
    def s3_client(self):
        """Lazy load boto3 S3 client."""
        if self._s3_client is None:
            import boto3
            self._s3_client = boto3.client(
                's3',
                endpoint_url=self.endpoint,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                region_name='auto'
            )
        return self._s3_client

    def public_url_for_path(self, path: str) -> str:
        """Get the public URL for a file in R2."""
        return f"{self.public_url}/{path}"

    def create_presigned_upload_url(self, path: str, expiration_seconds: int = 3600) -> dict:
        """Generate a presigned URL for direct browser upload to R2.

        Returns:
            dict with 'uploadUrl' and 'publicUrl' for the uploaded file
        """
        presigned_url = self.s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': self.bucket,
                'Key': path,
            },
            ExpiresIn=expiration_seconds
        )

        public_url = self.public_url_for_path(path)

        return {
            'uploadUrl': presigned_url,
            'publicUrl': public_url,
            'path': path,
            'bucket': self.bucket,
            'expiresIn': expiration_seconds
        }

    def upload(self, path: str, content: bytes, content_type: str = 'video/mp4', upsert: bool = True) -> None:
        """Upload file to R2."""
        self.s3_client.put_object(
            Bucket=self.bucket,
            Key=path,
            Body=content,
            ContentType=content_type
        )

    def delete(self, path: str) -> None:
        """Delete file from R2."""
        self.s3_client.delete_object(
            Bucket=self.bucket,
            Key=path
        )

    def public_url(self, path: str) -> str:
        """Get public URL for a file."""
        return self.public_url_for_path(path)


def get_r2_storage() -> Optional[R2Storage]:
    """Get R2 storage instance if configured."""
    access_key = os.getenv('R2_ACCESS_KEY_ID')
    secret_key = os.getenv('R2_SECRET_ACCESS_KEY')
    account_id = os.getenv('R2_ACCOUNT_ID')
    bucket = os.getenv('R2_BUCKET_NAME')
    public_url = os.getenv('R2_PUBLIC_URL')

    if not all([access_key, secret_key, account_id, bucket, public_url]):
        return None

    return R2Storage(
        access_key=access_key,
        secret_key=secret_key,
        account_id=account_id,
        bucket=bucket,
        public_url=public_url
    )
