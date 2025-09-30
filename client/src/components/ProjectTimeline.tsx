import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Pause, 
  Target,
  TrendingUp,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ProjectPhase {
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
}

interface ProjectTimelineProps {
  project: {
    _id: string;
    title: string;
    status: string;
    progress: number;
    timeline: {
      startDate?: string;
      expectedCompletionDate?: string;
      phases: ProjectPhase[];
    };
    updates: Array<{
      _id: string;
      title: string;
      description: string;
      postedBy: string;
      postedAt: string;
      isImportant: boolean;
    }>;
  };
  onPhaseUpdate?: (phaseId: string, updates: Partial<ProjectPhase>) => void;
  onAddPhase?: (phase: Omit<ProjectPhase, 'status'>) => void;
  canEdit?: boolean;
}

const ProjectTimeline: React.FC<ProjectTimelineProps> = ({
  project,
  onPhaseUpdate,
  onAddPhase,
  canEdit = false
}) => {
  const [showAddPhase, setShowAddPhase] = useState(false);

  const getPhaseStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      delayed: 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPhaseStatusIcon = (status: string) => {
    const statusIcons: Record<string, React.ReactNode> = {
      pending: <Clock className="h-4 w-4" />,
      in_progress: <Play className="h-4 w-4" />,
      completed: <CheckCircle className="h-4 w-4" />,
      delayed: <AlertCircle className="h-4 w-4" />,
    };
    return statusIcons[status] || <Clock className="h-4 w-4" />;
  };

  const calculatePhaseProgress = (phase: ProjectPhase) => {
    if (phase.status === 'completed') return 100;
    if (phase.status === 'pending') return 0;
    if (phase.status === 'delayed') return 75; // Assume 75% if delayed
    if (phase.status === 'in_progress') return 50; // Assume 50% if in progress
    return 0;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getOverallProjectStatus = () => {
    const phases = project.timeline.phases;
    if (phases.length === 0) return 'No phases defined';
    
    const completedPhases = phases.filter(p => p.status === 'completed').length;
    const inProgressPhases = phases.filter(p => p.status === 'in_progress').length;
    const delayedPhases = phases.filter(p => p.status === 'delayed').length;
    
    if (delayedPhases > 0) return 'Project is delayed';
    if (inProgressPhases > 0) return 'Project in progress';
    if (completedPhases === phases.length) return 'Project completed';
    return 'Project pending';
  };

  return (
    <div className="space-y-6">
      {/* Project Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Project Timeline Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{project.title}</h3>
                <p className="text-muted-foreground">{getOverallProjectStatus()}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{project.progress}%</div>
                <div className="text-sm text-muted-foreground">Overall Progress</div>
              </div>
            </div>
            
            <Progress value={project.progress} className="h-2" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {project.timeline.startDate && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Start Date</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(project.timeline.startDate)}</span>
                  </div>
                </div>
              )}
              
              {project.timeline.expectedCompletionDate && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Expected Completion</div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>{formatDate(project.timeline.expectedCompletionDate)}</span>
                  </div>
                </div>
              )}
              
              {project.timeline.expectedCompletionDate && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Days Remaining</div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className={calculateDaysRemaining(project.timeline.expectedCompletionDate) < 0 ? 'text-red-600' : ''}>
                      {calculateDaysRemaining(project.timeline.expectedCompletionDate)} days
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phases Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Project Phases
            </CardTitle>
            {canEdit && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAddPhase(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Phase
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {project.timeline.phases.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Phases Defined</h3>
              <p className="text-muted-foreground">
                Project phases help track progress and milestones.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {project.timeline.phases.map((phase, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{phase.name}</h4>
                        <Badge className={getPhaseStatusColor(phase.status)}>
                          <span className="flex items-center gap-1">
                            {getPhaseStatusIcon(phase.status)}
                            {phase.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">{phase.description}</p>
                    </div>
                    {canEdit && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm">{calculatePhaseProgress(phase)}%</span>
                    </div>
                    <Progress value={calculatePhaseProgress(phase)} className="h-2" />
                    
                    {(phase.startDate || phase.endDate) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {phase.startDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Start: {formatDate(phase.startDate)}</span>
                          </div>
                        )}
                        {phase.endDate && (
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span>End: {formatDate(phase.endDate)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Updates */}
      {project.updates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {project.updates.slice(0, 5).map((update) => (
                <div key={update._id} className="border-l-4 border-primary pl-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{update.title}</h4>
                        {update.isImportant && (
                          <Badge variant="destructive" className="text-xs">
                            Important
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm">{update.description}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(update.postedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Phase Form */}
      {showAddPhase && canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Phase</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault();
              // Handle form submission
              setShowAddPhase(false);
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phase Name</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Enter phase name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="delayed">Delayed</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea 
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="Enter phase description"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button type="submit">Add Phase</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddPhase(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectTimeline;
