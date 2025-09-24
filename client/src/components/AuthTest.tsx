import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { normalizePhoneNumber, getPhoneVariations } from '@/lib/phoneUtils';

export const AuthTest = () => {
  const [testPhone, setTestPhone] = useState('');
  const [testResult, setTestResult] = useState('');
  const { user, session } = useAuth();
  const { profile, userRoles } = useProfile();

  const testPhoneNormalization = () => {
    if (!testPhone) return;
    
    const normalized = normalizePhoneNumber(testPhone);
    const variations = getPhoneVariations(testPhone);
    
    setTestResult(`
      Original: ${testPhone}
      Normalized: ${normalized}
      Variations: ${variations.join(', ')}
    `);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto m-4">
      <CardHeader>
        <CardTitle>Authentication System Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Auth State */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Current Authentication State:</h3>
          <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
          <p><strong>Session:</strong> {session ? 'Active' : 'None'}</p>
          <p><strong>Current Profile Role:</strong> {profile?.role || 'None'}</p>
          <p><strong>Phone:</strong> {profile?.phone || 'None'}</p>
          <p><strong>Available Roles:</strong> {userRoles?.map(r => r.role).join(', ') || 'None'}</p>
        </div>

        {/* Phone Number Test */}
        <div className="space-y-2">
          <h3 className="font-semibold">Test Phone Number Normalization:</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Enter phone (e.g., 8799038003, +918799038003)"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
            />
            <Button onClick={testPhoneNormalization}>Test</Button>
          </div>
          {testResult && (
            <pre className="p-2 bg-gray-100 rounded text-sm whitespace-pre-wrap">
              {testResult}
            </pre>
          )}
        </div>

        {/* System Status */}
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">✅ System Features:</h3>
          <ul className="list-disc list-inside space-y-1 text-green-700">
            <li>Phone number normalization (handles +91, 0, etc.)</li>
            <li>Multi-role support per user</li>
            <li>Automatic profile & user_roles creation</li>
            <li>Role-based dashboard routing</li>
            <li>Proper database storage in both tables</li>
            <li>Phone format variation matching for login</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};