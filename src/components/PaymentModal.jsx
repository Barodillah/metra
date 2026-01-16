import React, { useState } from 'react';
import { X, Check, Shield, CreditCard, Wallet, ArrowRight, Loader2 } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, planType, onConfirm, userEmail }) => {
    const [selectedMethod, setSelectedMethod] = useState('qris');
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    const plans = {
        pro: {
            name: 'Pro Plan',
            price: 'Rp 29.000',
            period: '/bulan',
            features: [
                'Bebas Iklan',
                'Unlimited AI Chat',
                'Analisis Kelahiran Mendalam',
                'Akses Penuh Fitur Spiritual',
                'Zodiak & Weton Detail',
                'Prioritas Support'
            ],
            color: 'from-[#6366F1] to-[#06B6D4]',
            shadow: 'shadow-[#6366F1]/20'
        },
        visionary: {
            name: 'Visionary Plan',
            price: 'Rp 99.000',
            period: '/bulan',
            features: [
                'Semua Fitur Pro',
                'Akses Model AI Terbaru',
                'Unlimited Pergantian Tanggal Lahir',
                'Future Updates Early Access',
                'VVIP Badge & Support'
            ],
            color: 'from-amber-400 to-orange-500',
            shadow: 'shadow-amber-500/20'
        }
    };

    const currentPlan = plans[planType] || plans.pro;

    const paymentMethods = [
        { id: 'qris', name: 'QRIS', icon: CreditCard, description: 'Scan QR Code (GoPay, OVO, Dana, dll)' },
        { id: 'wallet', name: 'E-Wallet', icon: Wallet, description: 'LinkAja, ShopeePay' },
        { id: 'transfer', name: 'Bank Transfer', icon: Shield, description: 'BCA, Mandiri, BNI, BRI' },
    ];

    const handlePayment = async () => {
        setIsProcessing(true);
        // Simulate payment processing
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            onConfirm();
        } catch (error) {
            console.error('Payment failed', error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#0F172A] border border-white/10 rounded-3xl max-w-4xl w-full flex flex-col md:flex-row overflow-hidden animate-fade-in shadow-2xl">

                {/* Left Side - Plan Details */}
                <div className={`p-8 md:p-10 w-full md:w-5/12 bg-gradient-to-br ${currentPlan.color} relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 p-32 bg-white/10 blur-[60px] rounded-full translate-x-10 translate-y-[-20%] pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 p-32 bg-black/10 blur-[60px] rounded-full translate-x-[-20%] translate-y-[20%] pointer-events-none"></div>

                    <div className="relative z-10 h-full flex flex-col justify-between text-white">
                        <div>
                            <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                                Upgrade Account
                            </div>
                            <h2 className="text-3xl font-black mb-2">{currentPlan.name}</h2>
                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-4xl font-bold">{currentPlan.price}</span>
                                <span className="text-white/80 text-sm font-medium">{currentPlan.period}</span>
                            </div>

                            <div className="space-y-4">
                                {currentPlan.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="mt-0.5 p-0.5 bg-white/20 rounded-full">
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                        <span className="text-sm font-medium leading-tight">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/20">
                            <p className="text-xs text-white/70 italic">
                                "Investasi terbaik adalah investasi untuk mengenal diri sendiri."
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Side - Payment Method */}
                <div className="p-8 md:p-10 w-full md:w-7/12 bg-[#1E293B] relative">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 lg:top-8 lg:right-8 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                    >
                        <X size={20} />
                    </button>

                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-white mb-2">Pilih Metode Pembayaran</h3>
                        <p className="text-slate-400 text-sm">Transaksi aman dan terenkripsi.</p>
                    </div>

                    <div className="space-y-3 mb-8">
                        {paymentMethods.map((method) => (
                            <button
                                key={method.id}
                                onClick={() => setSelectedMethod(method.id)}
                                className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all group ${selectedMethod === method.id
                                    ? 'bg-[#6366F1]/10 border-[#6366F1] shadow-lg shadow-[#6366F1]/10'
                                    : 'bg-[#0F172A] border-white/5 hover:border-white/10'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${selectedMethod === method.id ? 'bg-[#6366F1] text-white' : 'bg-[#1E293B] text-slate-400 group-hover:text-slate-300'
                                    }`}>
                                    <method.icon size={24} />
                                </div>
                                <div className="text-left flex-1">
                                    <h4 className={`font-bold transition-colors ${selectedMethod === method.id ? 'text-white' : 'text-slate-300'}`}>
                                        {method.name}
                                    </h4>
                                    <p className="text-xs text-slate-500">{method.description}</p>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMethod === method.id ? 'border-[#6366F1]' : 'border-slate-600'
                                    }`}>
                                    {selectedMethod === method.id && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#6366F1]" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm p-4 bg-[#0F172A] rounded-xl border border-white/5">
                            <span className="text-slate-400">Total Pembayaran</span>
                            <span className="text-white font-bold text-lg">{currentPlan.price}</span>
                        </div>

                        <button
                            onClick={handlePayment}
                            disabled={isProcessing}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${isProcessing
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                : `bg-gradient-to-r ${currentPlan.color} text-white hover:brightness-110 shadow-lg`
                                }`}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    Bayar Sekarang
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>

                        <p className="text-center text-xs text-slate-500">
                            Dengan melanjutkan, Anda menyetujui Syarat & Ketentuan Layanan.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
