import {
  BarChartBig,
  CircleDot,
  Info,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { SectionTitle } from '../cards/SectionTitle';
import { DataInsightCard } from './DataInsightCard';
import { analyticsAPI } from '../../api/analyticsAPI';

export const DataInsights = () => {
  const [insights, setInsights] = useState({
    averageScore: '78%',
    averageScoreChange: '+5%',
    mostMissedQuestion: 'Question 5',
    mostMissedRate: '23%',
    mostMissedExam: 'COSC111 Midterm',
    examsAwaiting: '2',
    totalVariants: '150',
    variantPercent: 70,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);

        console.log('Fetching insights data...');

        // Fetch question analytics to get most missed question
        const questionAnalytics = await analyticsAPI.getQuestionAnalytics();
        console.log('Question analytics response:', questionAnalytics);

        const mostMissed = questionAnalytics.mostMissedPerExam?.[0];
        console.log('Most missed question:', mostMissed);

        // Fetch instructor overview for other metrics
        const overview = await analyticsAPI.getInstructorOverview();
        console.log('Instructor overview response:', overview);

        const newInsights = {
          averageScore: `${Math.round(overview.overview.average_grade)}%`,
          averageScoreChange: '+5%', // This would need trend calculation
          mostMissedQuestion: mostMissed
            ? `Question ${mostMissed.questionNumber}`
            : 'No Data',
          mostMissedRate: mostMissed
            ? `${Math.round(mostMissed.missRate * 100)}%`
            : 'N/A',
          mostMissedExam: mostMissed?.examTitle || 'No Data',
          examsAwaiting: '2', // This would need to be calculated from exam status
          totalVariants: '150', // This would need to be calculated
          variantPercent: 70, // This would need to be calculated
        };

        console.log('Setting insights:', newInsights);
        setInsights(newInsights);
      } catch (error) {
        console.error('Failed to fetch insights:', error);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  if (loading) {
    return (
      <section className="bg-card p-6 rounded-xl shadow-sm mb-10">
        <SectionTitle title="Data Insights" icon={<BarChartBig size={20} />} />
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-56 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-card p-6 rounded-xl shadow-sm mb-10">
      <SectionTitle title="Data Insights" icon={<BarChartBig size={20} />} />

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <DataInsightCard
          title="Average Score This Week"
          value={insights.averageScore}
          subtitle={insights.averageScoreChange}
          icon={<TrendingUp className="text-accent-emerald" size={16} />}
          barPercent={parseInt(insights.averageScore)}
          barColor="bg-accent-emerald"
        />

        <DataInsightCard
          title="Most Missed Question"
          value={insights.mostMissedQuestion}
          subtitle={`${insights.mostMissedRate} miss rate`}
          subDetail={`from ${insights.mostMissedExam}`}
          icon={<XCircle className="text-red-400" size={16} />}
          barPercent={parseInt(insights.mostMissedRate)}
          barColor="bg-red-500"
        />

        <DataInsightCard
          title="Exams Awaiting Results"
          value={insights.examsAwaiting}
          subtitle="exams awaiting results"
          icon={<Info className="text-accent-amber" size={16} />}
          barPercent={13}
          barColor="bg-accent-amber"
          barBg="bg-yellow-100"
        />

        <DataInsightCard
          title="Total Variants Generated"
          value={insights.totalVariants}
          subtitle="across all courses this term"
          icon={<CircleDot className="text-accent-indigo" size={16} />}
          circlePercent={insights.variantPercent}
          circleColor="stroke-accent-indigo"
        />
      </div>
    </section>
  );
};
