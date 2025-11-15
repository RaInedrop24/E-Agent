'use client';

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { Milestone } from '@/types';

interface ProgressTrackerProps {
  milestones: Milestone[];
  currentMilestone: number;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  milestones,
  currentMilestone,
}) => {
  const completedCount = milestones.filter(m => m.isCompleted).length;
  const progressPercentage = (completedCount / milestones.length) * 100;

  const getMilestoneIcon = (milestone: Milestone, index: number) => {
    if (milestone.isCompleted) {
      return <CheckCircle className="h-6 w-6 text-green-600" />;
    } else if (index === currentMilestone) {
      return <Clock className="h-6 w-6 text-blue-600" />;
    } else {
      return <Circle className="h-6 w-6 text-gray-400" />;
    }
  };

  const getMilestoneStatus = (milestone: Milestone, index: number) => {
    if (milestone.isCompleted) return 'completed';
    if (index === currentMilestone) return 'current';
    return 'pending';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Transaction Progress</span>
          <Badge variant="outline">
            {completedCount} of {milestones.length} completed
          </Badge>
        </CardTitle>
        <div className="space-y-2">
          <Progress value={progressPercentage} className="w-full" />
          <p className="text-sm text-gray-600">
            {progressPercentage.toFixed(0)}% Complete
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {milestones.map((milestone, index) => {
            const status = getMilestoneStatus(milestone, index);
            
            return (
              <div
                key={milestone.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border ${
                  status === 'completed'
                    ? 'bg-green-50 border-green-200'
                    : status === 'current'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getMilestoneIcon(milestone, index)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-sm font-medium ${
                        status === 'completed'
                          ? 'text-green-900'
                          : status === 'current'
                          ? 'text-blue-900'
                          : 'text-gray-900'
                      }`}
                    >
                      {milestone.title}
                    </h4>
                    <Badge
                      variant={
                        status === 'completed'
                          ? 'default'
                          : status === 'current'
                          ? 'secondary'
                          : 'outline'
                      }
                      className="ml-2"
                    >
                      {status === 'completed'
                        ? 'Done'
                        : status === 'current'
                        ? 'Active'
                        : 'Pending'}
                    </Badge>
                  </div>
                  <p
                    className={`mt-1 text-sm ${
                      status === 'completed'
                        ? 'text-green-700'
                        : status === 'current'
                        ? 'text-blue-700'
                        : 'text-gray-600'
                    }`}
                  >
                    {milestone.description}
                  </p>
                  {milestone.isCompleted && milestone.completedAt && (
                    <p className="mt-1 text-xs text-green-600">
                      Completed on{' '}
                      {new Date(milestone.completedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};