import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PremiumPlansPage = () => {
    const plans = [
        {
            id: 1,
            name: 'Basic Plan',
            description: 'Access to standard content and features.',
            price: 5,
            features: ['Standard quality', 'No ads', '1 device'],
        },
        {
            id: 2,
            name: 'Standard Plan',
            description: 'Better quality and additional features.',
            price: 10,
            features: ['HD quality', 'No ads', '2 devices'],
        },
        {
            id: 3,
            name: 'Premium Plan',
            description: 'All features unlocked.',
            price: 15,
            features: ['Ultra HD', 'No ads', '4 devices', 'Offline mode'],
        },
    ];

    const handleUpgrade = (planId) => {
        alert(`Upgrade to plan ID: ${planId}`);
    };

    return (
        <div className="container py-8">
            <h1 className="text-3xl font-bold mb-6 text-center">Upgrade to Premium</h1>
            <div className="grid md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <Card key={plan.id} className="shadow-xl">
                        <CardContent className="p-6">
                            <h2 className="text-xl font-semibold mb-2">{plan.name}</h2>
                            <p className="mb-4 text-gray-600">{plan.description}</p>
                            <p className="text-2xl font-bold mb-4">${plan.price}/month</p>
                            <ul className="mb-4 list-disc list-inside text-sm text-gray-700">
                                {plan.features.map((feature, index) => (
                                    <li key={index}>{feature}</li>
                                ))}
                            </ul>
                            <Button
                                onClick={() => handleUpgrade(plan.id)}
                                className="w-full"
                            >
                                Upgrade Now
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default PremiumPlansPage;
