/**
 * Centralized date formatting utilities for consistent timeline display
 */

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString || dateString === 'null' || dateString === 'undefined' || dateString === '') {
    return 'N/A';
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return 'N/A';
  }
};

export const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString || dateString === 'null' || dateString === 'undefined' || dateString === '') {
    return 'N/A';
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date time:', dateString, error);
    return 'N/A';
  }
};

export const calculateDuration = (startDate: string | null | undefined, endDate: string | null | undefined): string | null => {
  if (!startDate || !endDate || startDate === 'null' || endDate === 'null') {
    return null;
  }
  
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return null;
    }
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.ceil(diffDays / 30.44); // Average days per month
    const diffYears = Math.floor(diffMonths / 12);
    const remainingMonths = diffMonths % 12;
    
    if (diffYears > 0) {
      return remainingMonths > 0 ? `${diffYears} year${diffYears > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : `${diffYears} year${diffYears > 1 ? 's' : ''}`;
    } else {
      return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
    }
  } catch (error) {
    console.error('Error calculating duration:', error);
    return null;
  }
};

export const formatTimelineDisplay = (timeline: {
  startDate?: string;
  expectedCompletionDate?: string;
}): string => {
  if (!timeline.expectedCompletionDate) {
    return 'TBD';
  }
  
  const formattedDate = formatDate(timeline.expectedCompletionDate);
  if (formattedDate === 'N/A') {
    return 'TBD';
  }
  
  return formattedDate;
};

export const isValidDate = (dateString: string | null | undefined): boolean => {
  if (!dateString || dateString === 'null' || dateString === 'undefined' || dateString === '') {
    return false;
  }
  
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
};
