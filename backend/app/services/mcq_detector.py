import re
from typing import List, Dict, Optional, Tuple
import pdfplumber


class MCQDetector:
    """
    Dynamically detects and extracts Multiple Choice Questions from PDFs.
    Supports various formats:
    - Standard (A. B. C. D.)
    - Lowercase (a) b) c) d))
    - Numbers (1) 2) 3) 4))
    - Mixed formats
    """

    @staticmethod
    def extract_text_from_pdf(pdf_path: str) -> str:
        """
        Extract all text from PDF file with multi-column layout support.

        For PDFs with 2-column layouts, extracts left column first (top-to-bottom),
        then right column (top-to-bottom), maintaining proper reading order.
        """
        text_parts = []
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    # Extract all words/characters with position info
                    words = page.extract_words()

                    if not words:
                        # Fallback if word extraction fails
                        try:
                            page_text = page.extract_text(layout=True)
                        except:
                            page_text = page.extract_text(layout=False)

                        if page_text:
                            lines = page_text.split('\n')
                            lines = [line for line in lines if line.strip()]
                            text_parts.append('\n'.join(lines))
                        continue

                    # Detect if page has multi-column layout
                    # Get page width
                    page_width = page.width
                    mid_point = page_width / 2

                    # Separate words into left and right columns based on x coordinate
                    left_column_words = [w for w in words if w['x0'] < mid_point]
                    right_column_words = [w for w in words if w['x0'] >= mid_point]

                    # Function to reconstruct text from words maintaining line breaks
                    def words_to_text(words_list):
                        if not words_list:
                            return ""

                        # Sort by vertical position (top to bottom), then by horizontal (left to right)
                        sorted_words = sorted(words_list, key=lambda w: (round(w['top'], 1), w['x0']))

                        # Group words into lines (words with similar top coordinate are same line)
                        lines_dict = {}
                        for word in sorted_words:
                            # Round top position to group words on same line
                            line_key = round(word['top'], 1)
                            if line_key not in lines_dict:
                                lines_dict[line_key] = []
                            lines_dict[line_key].append(word)

                        # Sort lines by their y-position (top to bottom)
                        sorted_lines = sorted(lines_dict.items())

                        # Build text from lines
                        text_lines = []
                        for line_key, line_words in sorted_lines:
                            # Sort words in line left to right
                            line_words_sorted = sorted(line_words, key=lambda w: w['x0'])
                            line_text = ' '.join([w['text'] for w in line_words_sorted])
                            if line_text.strip():
                                text_lines.append(line_text)

                        return '\n'.join(text_lines)

                    # Extract text from columns
                    left_text = words_to_text(left_column_words)
                    right_text = words_to_text(right_column_words)

                    # Combine: left column first, then right column
                    if left_text and right_text:
                        page_text = left_text + '\n' + right_text
                    elif left_text:
                        page_text = left_text
                    else:
                        page_text = right_text

                    if page_text:
                        # Clean up: remove excessive blank lines
                        lines = page_text.split('\n')
                        lines = [line for line in lines if line.strip()]
                        text_parts.append('\n'.join(lines))
                        text_parts.append('\n')  # Page separator

        except Exception as e:
            raise ValueError(f"Failed to extract text from PDF: {str(e)}")

        return ''.join(text_parts)

    @staticmethod
    def clean_text(text: str) -> str:
        """Clean and normalize extracted text"""
        # First, normalize multiple spaces within lines to single space
        lines = text.split('\n')
        lines = [re.sub(r' +', ' ', line.rstrip()) for line in lines]
        text = '\n'.join(lines)

        # Remove multiple consecutive blank lines but preserve single newlines
        text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)

        return text.strip()

    @staticmethod
    def detect_mcq_blocks(text: str) -> List[str]:
        """
        Detect MCQ question blocks by splitting on question numbers (1-150).

        Uses a stricter approach: each question block contains ONLY the content
        between the current question number and the NEXT question number.
        This prevents mixing of questions from scrambled PDF extraction.
        """
        # First, remove section headers and junk
        text = re.sub(r'\n\s*(Part|PART|Section|SECTION|UNIT|Unit|Contents|Contents)\s+\d+.*\n', '\n', text, flags=re.IGNORECASE)
        text = re.sub(r'\n\s*\d+\s+QUESTIONS?\s+WITH?\s+ANSWERS?.*\n', '\n', text, flags=re.IGNORECASE)
        text = re.sub(r'This\s+file\s+was\s+submitted.*\n', '\n', text, flags=re.IGNORECASE)

        # Main pattern: split by question numbers (must be at line start)
        # This is STRICT: only matches when "N." is at the start of a line
        pattern = r'(?:^|\n)(\d{1,3})\s*[\.\)]\s+'

        # Split the text while keeping the question numbers
        parts = re.split(pattern, text, flags=re.MULTILINE)

        blocks = []

        # parts structure: [prefix, num1, content1, num2, content2, ...]
        # Start from index 1 to skip content before first question
        for i in range(1, len(parts), 2):
            if i + 1 < len(parts):
                question_num = parts[i]
                question_content = parts[i + 1]

                # For each block: take only lines up to the NEXT question number
                # This is implicit in the split, but we need to clean up the content

                # Split question_content into lines
                lines = [line.strip() for line in question_content.split('\n')]

                # Remove trailing content that looks like it belongs to next question
                # (If extraction went wrong, there might be extra question text at the end)
                cleaned_lines = []
                for line in lines:
                    # Stop if we hit what looks like a new question starting
                    # (This shouldn't happen with proper split, but just in case)
                    if line and re.match(r'^\d{1,3}[\.\)]\s+', line):
                        break
                    cleaned_lines.append(line)

                question_content = '\n'.join(cleaned_lines).strip()

                # Skip empty content
                if not question_content:
                    continue

                # Create the full block
                full_block = f"{question_num}. {question_content}"

                if full_block.strip():
                    blocks.append(full_block)

        return blocks

    @staticmethod
    def extract_options(question_block: str) -> Tuple[str, List[Dict[str, str]]]:
        """
        Extract question text and options from a question block.
        Supports: A. B. C. D. / A) B) C) D) / a) b) c) d) / 1) 2) 3) 4) formats

        STRICT mode: Rejects blocks with suspicious patterns that indicate
        mixed/scrambled questions (e.g., multiple question numbers, out-of-order choices).
        """
        # Remove question number prefix if present (e.g., "1. ")
        block = re.sub(r'^\d+\.\s*', '', question_block).strip()

        if not block:
            return '', []

        # REJECTION CHECK: If block contains multiple question number patterns, it's likely
        # a scrambled mix of multiple questions - reject it
        question_number_count = len(re.findall(r'\d{1,3}[\.\)]\s+', block))
        if question_number_count > 1:
            # More than one question number in this block = mixed content
            # This is a sign of extraction failure
            return '', []

        # Split into lines and preserve them
        lines = [line.strip() for line in block.split('\n') if line.strip()]

        if not lines:
            return '', []

        # Try Pattern 1: A. or A) with capital letters (most common)
        option_pattern = r'^([A-D])[\.\)]\s+(.+)$'
        option_matches = [(re.match(option_pattern, line), line, idx) for idx, line in enumerate(lines)]
        valid_options = [(m, line, idx) for m, line, idx in option_matches if m]

        if len(valid_options) >= 2:
            options = []
            option_indices = []
            for match, line, idx in valid_options:
                label = match.group(1)
                text = match.group(2).strip()
                if text:
                    options.append({'label': label, 'text': text})
                    option_indices.append(idx)

            if options:
                # Question is everything before first option
                first_option_idx = min(option_indices)
                question_text = ' '.join(lines[:first_option_idx]).strip()

                # REJECTION CHECK: If question text is too short or contains only numbers/symbols,
                # it's probably broken
                if len(question_text) < 5:
                    return '', []

                # Clean up question text by removing stray question numbers
                question_text = re.sub(r'\s*\d{1,3}[\.\)]\s*', ' ', question_text).strip()

                if question_text and len(options) >= 2:
                    return question_text, options

        # Try Pattern 2: a) or (a) with lowercase letters
        option_pattern = r'^[\(\[]?([a-d])[\)\.\]]\s+(.+)$'
        option_matches = [(re.match(option_pattern, line), line, idx) for idx, line in enumerate(lines)]
        valid_options = [(m, line, idx) for m, line, idx in option_matches if m]

        if len(valid_options) >= 2:
            options = []
            option_indices = []
            for match, line, idx in valid_options:
                label = match.group(1).upper()
                text = match.group(2).strip()
                if text:
                    options.append({'label': label, 'text': text})
                    option_indices.append(idx)

            if options:
                # Question is everything before first option
                first_option_idx = min(option_indices)
                question_text = ' '.join(lines[:first_option_idx]).strip()

                # Clean up question text by removing stray question numbers
                question_text = re.sub(r'\s*\d+[\.\)]\s*', ' ', question_text).strip()

                if question_text and len(options) >= 2:
                    return question_text, options

        # Try Pattern 3: 1) 2) 3) 4) with numbers
        option_pattern = r'^([1-4])\)\s+(.+)$'
        option_matches = [(re.match(option_pattern, line), line, idx) for idx, line in enumerate(lines)]
        valid_options = [(m, line, idx) for m, line, idx in option_matches if m]

        if len(valid_options) >= 2:
            options = []
            option_indices = []
            option_letters = ['A', 'B', 'C', 'D']
            for match_obj, line, idx in valid_options:
                num = int(match_obj.group(1)) - 1
                if num < 4:
                    text = match_obj.group(2).strip()
                    if text:
                        options.append({'label': option_letters[num], 'text': text})
                        option_indices.append(idx)

            if options:
                # Question is everything before first option
                first_option_idx = min(option_indices)
                question_text = ' '.join(lines[:first_option_idx]).strip()

                # Clean up question text by removing stray question numbers
                question_text = re.sub(r'\s*\d+[\.\)]\s*', ' ', question_text).strip()

                if question_text and len(options) >= 2:
                    return question_text, options

        # Try Pattern 4: Just letters in parentheses with text after (A) text format
        option_pattern = r'^\(([A-D])\)\s+(.+)$'
        option_matches = [(re.match(option_pattern, line), line, idx) for idx, line in enumerate(lines)]
        valid_options = [(m, line, idx) for m, line, idx in option_matches if m]

        if len(valid_options) >= 2:
            options = []
            option_indices = []
            for match, line, idx in valid_options:
                label = match.group(1)
                text = match.group(2).strip()
                if text:
                    options.append({'label': label, 'text': text})
                    option_indices.append(idx)

            if options:
                # Question is everything before first option
                first_option_idx = min(option_indices)
                question_text = ' '.join(lines[:first_option_idx]).strip()

                # Clean up question text by removing stray question numbers
                question_text = re.sub(r'\s*\d+[\.\)]\s*', ' ', question_text).strip()

                if question_text and len(options) >= 2:
                    return question_text, options

        # If no options found, return entire block as question
        return block, []

    @staticmethod
    def detect_correct_answer(question_block: str, options: List[Dict[str, str]]) -> Optional[str]:
        """
        Try to detect the correct answer from common indicators:
        - "Answer: A"
        - "Correct: B"
        - Marked with ✓ or * or bold
        - Underlined or highlighted
        """
        if not question_block or not options:
            return None

        # Look for explicit answer markers (most reliable)
        answer_patterns = [
            r'(?:Answer|Ans|Correct|KEY|Key)[\s:]*([A-D])',
            r'\*\s*([A-D])\.',  # *A. format
            r'✓\s*([A-D])',  # Checkmark
            r'\*([A-D])\)',  # *A) format
            r'\*\s*\(([A-D])\)',  # *(A) format
        ]

        for pattern in answer_patterns:
            match = re.search(pattern, question_block, re.IGNORECASE)
            if match:
                answer = match.group(1).upper()
                # Validate that this answer exists in options
                if any(opt['label'] == answer for opt in options):
                    return answer

        # Check if any option text is marked with special indicators
        for opt in options:
            text = opt['text']
            # Check for bold markers (**text**), underline (*text*), or emphasis
            if text.startswith('*') or text.startswith('_') or text.startswith('**'):
                return opt['label']

        # Default: if no answer found, return None (will need manual marking)
        return None

    @classmethod
    def detect_mcqs_from_text(
        cls,
        text: str,
        category: str = "General Education"
    ) -> List[Dict]:
        """
        Main method: Detect all MCQs from text and return structured data.
        Returns properly structured questions with minimal processing.

        Includes validation to reject malformed or scrambled questions.
        """
        # Clean text (preserve structure better)
        text = cls.clean_text(text)

        # Detect question blocks
        blocks = cls.detect_mcq_blocks(text)

        mcqs = []
        skipped_blocks = []

        for block_idx, block in enumerate(blocks, 1):
            if not block.strip():
                continue

            # Extract question and options
            question_text, options = cls.extract_options(block)

            # Skip if no valid question text or insufficient options
            if not question_text or not options or len(options) < 2:
                skipped_blocks.append({
                    'block_num': block_idx,
                    'reason': 'No question text' if not question_text else 'Insufficient options'
                })
                continue

            # VALIDATION: Check if question_text looks suspiciously long (likely mixed questions)
            # A typical question should be < 500 characters (increased from 300 to allow longer questions)
            if len(question_text) > 500:
                skipped_blocks.append({
                    'block_num': block_idx,
                    'reason': f'Question too long ({len(question_text)} chars) - likely mixed questions'
                })
                continue

            # VALIDATION: Check if question text contains suspicious patterns
            # (multiple choice letters in succession indicating mixed content)
            # Only reject if there are 2 or more A/B/C/D patterns - this is more lenient
            choice_patterns = len(re.findall(r'[A-D]\.\s+', question_text))
            if choice_patterns > 2:
                skipped_blocks.append({
                    'block_num': block_idx,
                    'reason': f'Question text contains too many choice-like patterns ({choice_patterns}) - likely mixed'
                })
                continue

            # Try to detect correct answer
            correct_answer = cls.detect_correct_answer(block, options)
            needs_review = correct_answer is None

            # If no correct answer detected, default to first option (will be flagged for review)
            if not correct_answer and options:
                correct_answer = options[0]['label']

            # Build MCQ object - clean format without prefixes
            mcq = {
                'question_text': question_text.replace('\n', ' ').strip(),
                'choices': [opt['text'] for opt in options],  # Store just the text, no prefix
                'correct_answer': correct_answer or 'A',
                'category': category,
                'source': 'pdf_import',
                'needs_review': needs_review  # Flag if answer wasn't auto-detected
            }

            mcqs.append(mcq)

        return mcqs, skipped_blocks

    @classmethod
    def detect_mcqs_from_pdf(
        cls,
        pdf_path: str,
        category: str = "General Education"
    ) -> Tuple[List[Dict], List[str]]:
        """
        Extract MCQs from a PDF file.
        Returns: (mcqs_list, error_messages)
        """
        errors = []
        mcqs = []

        try:
            # Extract text from PDF
            text = cls.extract_text_from_pdf(pdf_path)

            if not text.strip():
                errors.append("PDF is empty or text extraction failed")
                return [], errors

            # Detect MCQs
            mcqs, skipped = cls.detect_mcqs_from_text(text, category)

            if not mcqs:
                errors.append("No MCQs detected in PDF. Check the format of questions and options.")

            # Add info about skipped blocks if any
            if skipped:
                skipped_summary = f"Skipped {len(skipped)} blocks during detection"
                if len(skipped) <= 10:
                    # Show details for small number of skipped blocks
                    reasons = "; ".join([f"Block {s.get('block_num', '?')}: {s.get('reason', 'unknown')}" for s in skipped])
                    skipped_summary += f" - {reasons}"
                errors.append(skipped_summary)

        except Exception as e:
            errors.append(f"Error processing PDF: {str(e)}")

        return mcqs, errors
