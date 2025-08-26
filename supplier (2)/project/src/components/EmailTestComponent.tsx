import React, { useState } from 'react';
import { supplierEmailService } from '../services/supplierEmailService';

export const EmailTestComponent: React.FC = () => {
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const checkConfiguration = () => {
    const status = supplierEmailService.getConfigStatus();
    setConfigStatus(status);
  };

  const testEmailService = async () => {
    setIsLoading(true);
    setTestResult('');

    try {
      // Initialize the service
      supplierEmailService.initialize();

      // Check if configured
      if (!supplierEmailService.isConfigured()) {
        setTestResult('❌ Email service not configured. Please check your .env file.');
        return;
      }

      // Create a test order
      const testOrder = {
        id: 'TEST123456789',
        masterOrderId: 'TEST123456789',
        fournisseurId: 'test-supplier-123',
        fournisseurName: 'Test Supplier',
        userId: 'test-customer-123',
        userEmail: 'test@example.com',
        userName: 'Test Customer',
        userPhone: '+1234567890',
        subtotal: 25.99,
        deliveryFee: 5.00,
        tax: 2.60,
        total: 33.59,
        status: 'pending' as const,
        paymentStatus: 'pending' as const,
        paymentMethod: 'Credit Card',
        deliveryAddress: {
          street: '123 Test Street',
          city: 'Test City',
          postalCode: '12345',
          country: 'Test Country',
          instructions: 'Ring doorbell twice'
        },
        orderNotes: 'This is a test order for email verification',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [
          {
            productId: 'prod-1',
            productName: 'Test Product 1',
            productImage: 'https://via.placeholder.com/100',
            quantity: 2,
            unitPrice: 12.99,
            totalPrice: 25.98,
            unit: 'pieces'
          },
          {
            productId: 'prod-2',
            productName: 'Test Product 2',
            productImage: 'https://via.placeholder.com/100',
            quantity: 1,
            unitPrice: 7.61,
            totalPrice: 7.61,
            unit: 'pieces'
          }
        ]
      };

      // Send test email
      const result = await supplierEmailService.sendOrderNotification(testOrder);
      
      if (result) {
        setTestResult('✅ Test email sent successfully! Check your supplier email inbox.');
      } else {
        setTestResult('❌ Failed to send test email. Check console for errors.');
      }
    } catch (error) {
      console.error('Test email error:', error);
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        🧪 Test Email Service Configuration
      </h2>

      {/* Configuration Check */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          📋 Configuration Status
        </h3>
        <button
          onClick={checkConfiguration}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Check Configuration
        </button>
        
        {configStatus && (
          <div className="mt-4">
            <div className={`p-3 rounded-lg ${
              configStatus.isConfigured 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <p className="font-semibold">
                {configStatus.isConfigured ? '✅ Configured' : '❌ Not Configured'}
              </p>
              {!configStatus.isConfigured && (
                <div className="mt-2">
                  <p className="text-sm">Missing environment variables:</p>
                  <ul className="list-disc list-inside text-sm mt-1">
                    {configStatus.missingFields.map((field: string) => (
                      <li key={field} className="font-mono">{field}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Test Email Sending */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          📧 Test Email Sending
        </h3>
        <button
          onClick={testEmailService}
          disabled={isLoading}
          className={`px-4 py-2 rounded transition-colors ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isLoading ? 'Sending...' : 'Send Test Email'}
        </button>
        
        {testResult && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50 text-blue-800">
            <p className="font-semibold">{testResult}</p>
          </div>
        )}
      </div>

      {/* Setup Instructions */}
      <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">
          ⚠️ Setup Required
        </h3>
        <div className="text-yellow-700 text-sm space-y-2">
          <p>Before testing, make sure you have:</p>
          <ol className="list-decimal list-inside ml-4 space-y-1">
            <li>Created an EmailJS account at <a href="https://www.emailjs.com/" target="_blank" rel="noopener noreferrer" className="underline">emailjs.com</a></li>
            <li>Set up an email service (Gmail, Outlook, etc.)</li>
            <li>Created an email template for supplier notifications</li>
            <li>Created a <code className="bg-yellow-200 px-1 rounded">.env</code> file with your EmailJS credentials</li>
            <li>Implemented the <code className="bg-yellow-200 px-1 rounded">getSupplierEmail</code> function in the service</li>
          </ol>
          <p className="mt-3">
            📖 See <code className="bg-yellow-200 px-1 rounded">SUPPLIER_EMAIL_SETUP.md</code> for detailed instructions.
          </p>
        </div>
      </div>

      {/* Environment Variables Help */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          🔧 Required Environment Variables
        </h3>
        <div className="bg-gray-800 text-green-400 p-4 rounded font-mono text-sm overflow-x-auto">
          <div>VITE_EMAILJS_SERVICE_ID=your_service_id</div>
          <div>VITE_EMAILJS_SUPPLIER_ORDER_TEMPLATE_ID=your_template_id</div>
          <div>VITE_EMAILJS_PUBLIC_KEY=your_public_key</div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Copy these to your <code className="bg-gray-200 px-1 rounded">.env</code> file and replace with actual values.
        </p>
      </div>
    </div>
  );
};