'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/Card';

interface DailyMetric {
  date: string;
  total_users?: number;
  total_requests?: number;
  total_jobs?: number;
  total_payments?: number;
}

interface JobStatusData {
  [key: string]: number;
}

interface Props {
  dailyMetrics?: DailyMetric[];
  jobStatusData?: JobStatusData;
  days: number;
}

const JOB_STATUS_COLORS: Record<string, string> = {
  completed: '#10b981',
  in_progress: '#6366f1',
  pending: '#f59e0b',
  scheduled: '#8b5cf6',
  cancelled: '#ef4444',
  disputed: '#f97316',
};

const CHART_COLORS = {
  users: '#6366f1',
  requests: '#10b981',
  payments: '#8b5cf6',
  jobs: '#f59e0b',
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 shadow-elevated text-sm">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="capitalize">{p.name.replace(/_/g, ' ')}:</span>
          <span className="font-semibold ml-1">{p.value?.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

export function AnalyticsCharts({ dailyMetrics, jobStatusData, days }: Props) {
  const chartData = [...(dailyMetrics ?? [])]
    .reverse()
    .slice(0, days)
    .map((row) => ({
      date: row.date?.slice(5) ?? '', // MM-DD format
      Users: row.total_users ?? 0,
      Requests: row.total_requests ?? 0,
      Jobs: row.total_jobs ?? 0,
      Payments: row.total_payments ?? 0,
    }));

  const pieData = Object.entries(jobStatusData ?? {})
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Line chart: Users & Requests */}
      <Card elevated>
        <CardContent className="p-6">
          <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-5">
            Daily Activity — Users & Requests
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-gray-800" strokeOpacity={0.6} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'currentColor' }} className="text-gray-500 dark:text-gray-400" tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} className="text-gray-500 dark:text-gray-400" tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Users" stroke={CHART_COLORS.users} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="Requests" stroke={CHART_COLORS.requests} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-sm text-gray-400">No data for this period</div>
          )}
        </CardContent>
      </Card>

      {/* Bar chart: Payments */}
      <Card elevated>
        <CardContent className="p-6">
          <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-5">
            Daily Jobs & Payments
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-gray-800" strokeOpacity={0.6} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'currentColor' }} className="text-gray-500 dark:text-gray-400" tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} className="text-gray-500 dark:text-gray-400" tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Jobs" fill={CHART_COLORS.jobs} radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="Payments" fill={CHART_COLORS.payments} radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-sm text-gray-400">No data for this period</div>
          )}
        </CardContent>
      </Card>

      {/* Pie chart: Job status distribution */}
      {pieData.length > 0 && (
        <Card elevated>
          <CardContent className="p-6">
            <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-5">
              Job Status Distribution
            </h3>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={JOB_STATUS_COLORS[entry.name.replace(/ /g, '_')] ?? '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [
                      typeof value === 'number' ? value.toLocaleString() : String(value ?? 0),
                      String(name),
                    ]}
                    contentStyle={{
                      background: 'var(--bg)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {pieData.map((entry) => {
                  const total = pieData.reduce((s, d) => s + d.value, 0);
                  const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                  return (
                    <div key={entry.name} className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ background: JOB_STATUS_COLORS[entry.name.replace(/ /g, '_')] ?? '#94a3b8' }}
                        />
                        <span className="text-gray-700 dark:text-gray-300 capitalize">{entry.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">{entry.value}</span>
                        <span className="text-gray-400 text-xs">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
