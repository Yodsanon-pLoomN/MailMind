'use client';

import { useState, useEffect } from 'react';
import EmailItem from './EmailItem';
import { Email } from '@/lib/utils';

interface EmailsResponse {
  items: Email[];
  nextPageToken?: string;
  hasMore: boolean;
}

export default function EmailList() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageToken, setPageToken] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);

  const fetchEmails = async (token?: string) => {
    try {
      setLoading(true);
      setError(null);

      const url = new URL('/api/emails', window.location.origin);
      if (token) {
        url.searchParams.set('pageToken', token);
      }
      url.searchParams.set('pageSize', '10');

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch emails');
      }

      const data: EmailsResponse = await response.json();
      setEmails(data.items);
      setPageToken(data.nextPageToken);
      setHasMore(data.hasMore);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching emails:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  // 👇 เพิ่มตัวนี้ไว้ให้ลูกเรียก
  const handleEmailUpdate = (id: string, patch: Partial<Email>) => {
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  };

  const handleNext = () => {
    if (pageToken) {
      fetchEmails(pageToken);
    }
  };

  const handlePrevious = () => {
    fetchEmails(undefined);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Emails</h3>
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => fetchEmails()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        {/* ... ของเดิม ... */}
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {emails.map((email) => (
          <EmailItem
            key={email.id}
            email={email}
            onEmailUpdate={handleEmailUpdate} // 👈 ส่งลงไป
          />
        ))}
      </div>

      {(pageToken || emails.length > 0) && (
        <div className="flex items-center justify-between mt-6 pt-6 border-t">
          <button
            onClick={handlePrevious}
            disabled={!pageToken}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Showing {emails.length} email{emails.length !== 1 ? 's' : ''}
          </span>

          <button
            onClick={handleNext}
            disabled={!hasMore}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
