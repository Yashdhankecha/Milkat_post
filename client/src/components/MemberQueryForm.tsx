import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { useToast } from '../hooks/use-toast';
import apiClient from '../lib/api';
import { MessageSquare, Send, AlertCircle } from 'lucide-react';

interface MemberQueryFormProps {
  societyId: string;
  onQuerySubmitted?: () => void;
}

const MemberQueryForm: React.FC<MemberQueryFormProps> = ({ societyId, onQuerySubmitted }) => {
  const [queryText, setQueryText] = useState('');
  const [category, setCategory] = useState('other');
  const [priority, setPriority] = useState('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const categories = [
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'amenities', label: 'Amenities' },
    { value: 'security', label: 'Security' },
    { value: 'billing', label: 'Billing' },
    { value: 'complaint', label: 'Complaint' },
    { value: 'suggestion', label: 'Suggestion' },
    { value: 'other', label: 'Other' }
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!queryText.trim()) {
      toast({
        title: "Error",
        description: "Please enter your query text",
        variant: "destructive",
      });
      return;
    }

    if (queryText.trim().length > 1000) {
      toast({
        title: "Error",
        description: "Query text must be less than 1000 characters",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.submitQuery({
        societyId,
        queryText: queryText.trim(),
        category,
        priority
      });

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Your query has been submitted successfully",
        });
        
        // Reset form
        setQueryText('');
        setCategory('other');
        setPriority('medium');
        
        // Notify parent component
        if (onQuerySubmitted) {
          onQuerySubmitted();
        }
      }
    } catch (error) {
      console.error('Error submitting query:', error);
      toast({
        title: "Error",
        description: "Failed to submit query. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-70 blur-3xl pointer-events-none"></div>
      
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-gray-100">
          <div className="p-2 rounded-full bg-blue-500/20 dark:bg-blue-700/30 backdrop-blur-sm">
            <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          Submit a Query
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Share your concerns, suggestions, or questions with the society management
        </p>
      </CardHeader>

      <CardContent className="relative">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="queryText" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Your Query *
            </Label>
            <Textarea
              id="queryText"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Describe your query, concern, or suggestion..."
              className="min-h-[120px] resize-none border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
              maxLength={1000}
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Be specific and clear in your description</span>
              <span>{queryText.length}/1000</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Priority
              </Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((pri) => (
                    <SelectItem key={pri.value} value={pri.value}>
                      {pri.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Important:</p>
              <ul className="space-y-1 text-xs">
                <li>• Your query will be visible to society management</li>
                <li>• You'll receive a notification when there's a response</li>
                <li>• Urgent queries will be prioritized for faster response</li>
              </ul>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !queryText.trim()}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-blue-500/30 transition-all duration-300 group py-3"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Submitting Query...
              </>
            ) : (
              <>
                <Send className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                Submit Query
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MemberQueryForm;