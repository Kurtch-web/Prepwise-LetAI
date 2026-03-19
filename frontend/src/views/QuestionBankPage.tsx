import { useTheme } from '../providers/ThemeProvider';
import { QuestionsDisplay } from '../components/QuestionsDisplay';

export function QuestionBankPage() {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';

  return (
    <div className={`transition-colors duration-200 ${
      isLightMode
        ? 'bg-gradient-to-b from-green-50 via-white to-slate-50'
        : 'bg-[#051b15]'
    }`}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <QuestionsDisplay />
      </div>
    </div>
  );
}
