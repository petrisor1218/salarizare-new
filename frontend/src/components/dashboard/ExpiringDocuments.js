// frontend/src/components/dashboard/ExpiringDocuments.js
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@mui/material';
import { dashboardAPI } from '../../services/api/dashboard';

export function ExpiringDocuments() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            const response = await dashboardAPI.getExpiringDocuments();
            setDocuments(response.data);
        } catch (error) {
            console.error('Error loading documents:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader title="Documente care Expiră" />
                <CardContent>
                    <div className="animate-pulse space-y-4">
                        {[1,2,3].map(i => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader title="Documente care Expiră" />
            <CardContent>
                <div className="space-y-4">
                    {documents.map((doc) => (
                        <div key={doc.id} className="flex justify-between items-center p-4 rounded-lg border">
                            <div>
                                <p className="font-medium">{doc.tip}</p>
                                <p className="text-sm text-muted-foreground">{doc.entitate}</p>
                            </div>
                            <p className={`text-sm font-medium ${
                                new Date(doc.dataExpirare) < new Date() 
                                    ? 'text-red-600' 
                                    : 'text-yellow-600'
                            }`}>
                                {new Date(doc.dataExpirare).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}