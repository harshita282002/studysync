import React, { useEffect, useState } from 'react';
import { AlertCircle, BadgeCheck, Check, CreditCard, ShieldCheck, X } from 'lucide-react';
import { getRazorpayKeyId, loadRazorpayScript, type RazorpayOptions } from '../lib/razorpay';

interface ProUpgradeModalProps {
  open: boolean;
  isProMember: boolean;
  userName: string;
  userEmail: string;
  lastPaymentId?: string;
  onClose: () => void;
  onPaymentSuccess: (razorpayPaymentId: string) => Promise<void>;
}

const PRO_PERKS = [
  'Priority search placement across campus Peer Directory',
  'Unlimited direct teammate collaboration invites',
  'AI-balanced cross-functional team builder recommendations',
  'Verified Pro badge displayed on your profile & project posts',
];

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  open,
  isProMember,
  userName,
  userEmail,
  lastPaymentId,
  onClose,
  onPaymentSuccess,
}) => {
  const [processing, setProcessing] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPaymentError(null);
    let active = true;
    void loadRazorpayScript().then((loaded) => {
      if (active) setScriptReady(loaded);
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      active = false;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleRazorpayCheckout = async () => {
    setPaymentError(null);
    setProcessing(true);

    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) {
      setProcessing(false);
      setPaymentError(
        'Unable to load Razorpay Checkout script. Please check your internet connection or disable script blockers.'
      );
      return;
    }

    const razorpayKey = getRazorpayKeyId();

    const options: RazorpayOptions = {
      key: razorpayKey,
      amount: 14900,
      currency: 'INR',
      name: 'StudySync Pro',
      description: 'Monthly Campus Peer-Matching Pro Subscription',
      prefill: {
        name: userName,
        email: userEmail,
      },
      theme: {
        color: '#4F46E5',
      },
      handler: async (response) => {
        try {
          await onPaymentSuccess(response.razorpay_payment_id);
          onClose();
        } catch (err) {
          setPaymentError(
            err instanceof Error
              ? err.message
              : 'Payment succeeded but saving receipt to Firestore failed.'
          );
        } finally {
          setProcessing(false);
        }
      },
      modal: {
        ondismiss: () => {
          setProcessing(false);
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (failure) => {
        setProcessing(false);
        setPaymentError(
          failure?.error?.description ||
            'Razorpay payment was declined or failed. Please try again.'
        );
      });
      rzp.open();
    } catch (err) {
      setProcessing(false);
      setPaymentError(
        err instanceof Error
          ? err.message
          : 'Could not initialize Razorpay Checkout. Verify VITE_RAZORPAY_KEY_ID in .env.'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pro-upgrade-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-indigo-600" />
            <h2 id="pro-upgrade-title" className="text-base font-semibold text-slate-900">
              StudySync Pro
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close StudySync Pro modal"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-xs font-medium text-indigo-600 mb-1">
              For ambitious case competitors & team leads
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-slate-900 font-mono tabular-nums">₹149</span>
              <span className="text-sm text-slate-500">/ month · Razorpay INR Checkout</span>
            </div>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Stand out before semester project rush and national competition deadlines with verified discovery perks.
            </p>
          </div>

          <ul className="space-y-2.5 border-t border-b border-slate-100 py-4">
            {PRO_PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-2.5 text-sm text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{perk}</span>
              </li>
            ))}
          </ul>

          {isProMember ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-800">
                <span className="font-medium">StudySync Pro is active on your account</span>
                <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>
              {lastPaymentId && (
                <p className="text-xs text-slate-500 font-mono tabular-nums">
                  Receipt ID: {lastPaymentId}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {paymentError && (
                <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{paymentError}</span>
                </div>
              )}

              <button
                type="button"
                disabled={processing}
                onClick={handleRazorpayCheckout}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                {processing ? 'Opening Razorpay Checkout...' : 'Pay ₹149 & Upgrade to Pro'}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {scriptReady
                    ? 'Secured by Razorpay · UPI, Cards & NetBanking'
                    : 'Loading Razorpay Checkout gateway...'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
