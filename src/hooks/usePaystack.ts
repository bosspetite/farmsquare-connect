import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

// Declare Paystack on window
declare global {
    interface Window {
        PaystackPop?: any;
        Paystack?: any;
    }
}

export interface PaystackConfig {
    email: string;
    amount: number;
    reference?: string;
    metadata?: Record<string, any>;
    onSuccess: (reference: string) => void;
    onClose?: () => void;
    onError?: (message: string) => void;
}

/**
 * Hook for Paystack payment integration
 * Uses environment variable VITE_PAYSTACK_PUBLIC_KEY
 */
export const usePaystack = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Get API key from environment
    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    const sanitizedPublicKey =
        typeof publicKey === "string" ? publicKey.trim() : "";
    const isValidPaystackPublicKey = (key: unknown): key is string => {
        if (typeof key !== "string") return false;
        const normalized = key.trim();
        if (!/^(pk_test_|pk_live_)/.test(normalized)) return false;
        if (normalized.length < 25) return false;
        if (
            normalized.includes("...") ||
            /your|placeholder|example/i.test(normalized)
        ) {
            return false;
        }
        return true;
    };

    const getPaystackRuntime = () => {
        const paystackPop = window.PaystackPop as any;
        const paystackV1Api =
            paystackPop &&
            (typeof paystackPop === "object" ||
                typeof paystackPop === "function") &&
            typeof paystackPop.setup === "function"
                ? paystackPop
                : undefined;
        const paystackCtorCandidates = [
            window.Paystack,
            window.PaystackPop,
        ].filter((candidate) => typeof candidate === "function");
        const paystackV2Ctor = paystackCtorCandidates.find(
            (candidate: any) =>
                typeof candidate?.prototype?.newTransaction === "function" ||
                typeof candidate?.prototype?.checkout === "function",
        ) as (new () => any) | undefined;

        return {
            paystackV1Api,
            paystackV2Ctor,
        };
    };

    // Check if Paystack script is loaded
    useEffect(() => {
        let cancelled = false;
        let timeoutHandle: number | undefined;
        const scriptSrc = "https://js.paystack.co/v1/inline.js";

        const markLoaded = () => {
            if (cancelled) return;
            const runtime = getPaystackRuntime();
            if (!runtime.paystackV1Api && !runtime.paystackV2Ctor) {
                console.error(
                    "[Paystack] Script loaded but no supported checkout runtime was found",
                );
                setIsLoaded(false);
                setLoadError("Paystack runtime did not initialize correctly.");
                return;
            }

            console.log("[Paystack] Script loaded successfully", {
                runtime: runtime.paystackV1Api ? "v1" : "v2",
            });
            setIsLoaded(true);
            setLoadError(null);
        };

        const markFailed = () => {
            if (cancelled) return;
            console.error("[Paystack] Script failed to load");
            setIsLoaded(false);
            setLoadError("Paystack script failed to load.");
        };

        const existingRuntime = getPaystackRuntime();
        if (existingRuntime.paystackV1Api || existingRuntime.paystackV2Ctor) {
            markLoaded();
            return () => {
                cancelled = true;
            };
        }

        const existingScript = document.querySelector(
            `script[src="${scriptSrc}"]`,
        ) as HTMLScriptElement | null;
        const script = existingScript || document.createElement("script");

        script.src = scriptSrc;
        script.async = true;

        script.addEventListener("load", markLoaded);
        script.addEventListener("error", markFailed);

        if (!existingScript) {
            document.body.appendChild(script);
        }

        timeoutHandle = window.setTimeout(() => {
            const runtime = getPaystackRuntime();
            if (!runtime.paystackV1Api && !runtime.paystackV2Ctor) {
                markFailed();
            }
        }, 15000);

        return () => {
            cancelled = true;
            script.removeEventListener("load", markLoaded);
            script.removeEventListener("error", markFailed);
            if (timeoutHandle) {
                window.clearTimeout(timeoutHandle);
            }
        };
    }, []);

    // Generate unique reference
    const generateReference = (): string => {
        return `FSQ_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    };

    // Initialize Paystack payment
    const initializePayment = (config: PaystackConfig): void => {
        const reference = config.reference?.trim() || generateReference();
        const amount = Number(config.amount);
        const amountInKobo = Math.round(amount * 100);

        // Validate API key
        if (!isValidPaystackPublicKey(sanitizedPublicKey)) {
            if (import.meta.env.DEV) {
                console.error(
                    "Invalid Paystack public key:",
                    sanitizedPublicKey,
                );
                console.log("[Paystack] Key diagnostics", {
                    exists: Boolean(sanitizedPublicKey),
                    prefix: sanitizedPublicKey.slice(0, 8),
                    length: sanitizedPublicKey.length,
                });
            }
            toast({
                title: "Payment configuration error",
                description:
                    "Payment configuration error. Please contact support.",
                variant: "destructive",
            });
            setIsProcessing(false);
            config.onError?.("Invalid Paystack public key");
            return;
        }

        // Check if Paystack is loaded
        const runtime = getPaystackRuntime();
        if (
            loadError ||
            !isLoaded ||
            (!runtime.paystackV1Api && !runtime.paystackV2Ctor)
        ) {
            toast({
                title: "Payment System Loading",
                description: loadError || "Please wait a moment and try again",
                variant: "destructive",
            });
            config.onError?.(loadError || "Paystack not loaded");
            return;
        }

        // Validate email
        if (!config.email || !config.email.includes("@")) {
            toast({
                title: "Invalid Email",
                description: "Please enter a valid email address",
                variant: "destructive",
            });
            config.onError?.("Invalid email");
            return;
        }

        // Validate amount
        if (
            !Number.isFinite(amount) ||
            amount <= 0 ||
            !Number.isFinite(amountInKobo) ||
            amountInKobo <= 0
        ) {
            toast({
                title: "Invalid Amount",
                description: "Payment amount must be greater than zero",
                variant: "destructive",
            });
            config.onError?.("Invalid amount");
            return;
        }

        // Validate reference
        if (!reference) {
            toast({
                title: "Payment Reference Error",
                description: "Payment could not be started. Please try again.",
                variant: "destructive",
            });
            config.onError?.("Invalid payment reference");
            return;
        }

        setIsProcessing(true);

        try {
            let isSettled = false;
            let didLaunch = false;
            let launchWatchdog: number | undefined;
            let settleWatchdog: number | undefined;

            const clearLaunchWatchdog = () => {
                if (launchWatchdog) {
                    window.clearTimeout(launchWatchdog);
                    launchWatchdog = undefined;
                }
            };
            const clearSettleWatchdog = () => {
                if (settleWatchdog) {
                    window.clearTimeout(settleWatchdog);
                    settleWatchdog = undefined;
                }
            };

            const finishProcessing = () => {
                isSettled = true;
                clearLaunchWatchdog();
                clearSettleWatchdog();
                setIsProcessing(false);
            };

            console.log("[Paystack] Preparing payment", {
                email: config.email,
                amount,
                amountInKobo,
                reference,
                metadata: config.metadata || {},
                runtime: runtime.paystackV1Api ? "v1" : "v2",
            });
            settleWatchdog = window.setTimeout(() => {
                if (isSettled) {
                    return;
                }
                console.error(
                    "[Paystack] Checkout did not settle within the expected time",
                    { reference },
                );
                finishProcessing();
                const errorMessage =
                    "Payment could not be completed in time. Please try again.";
                toast({
                    title: "Payment timeout",
                    description: errorMessage,
                    variant: "destructive",
                });
                config.onError?.(errorMessage);
            }, 120000);

            if (runtime.paystackV1Api) {
                const handler = runtime.paystackV1Api.setup({
                    key: sanitizedPublicKey,
                    email: config.email,
                    amount: amountInKobo,
                    currency: "NGN",
                    ref: reference,
                    metadata: config.metadata || {},
                    channels: ["card", "bank", "bank_transfer", "ussd"],
                    onClose: () => {
                        console.log("[Paystack] V1 checkout closed by user", {
                            reference,
                        });
                        finishProcessing();
                        config.onClose?.();
                    },
                    callback: (response: {
                        reference: string;
                        status: string;
                        message: string;
                    }) => {
                        console.log(
                            "[Paystack] V1 callback received",
                            response,
                        );
                        finishProcessing();
                        if (
                            response.status === "success" &&
                            response.reference
                        ) {
                            config.onSuccess(response.reference);
                        } else {
                            const errorMessage =
                                response.message ||
                                "Payment could not be processed. Please try again.";
                            toast({
                                title: "Payment Failed",
                                description: errorMessage,
                                variant: "destructive",
                            });
                            config.onError?.(errorMessage);
                        }
                    },
                });

                console.log("[Paystack] Opening v1 checkout iframe", {
                    reference,
                });
                handler.openIframe();
                launchWatchdog = window.setTimeout(() => {
                    const paystackFrame = document.querySelector(
                        'iframe[src*="paystack"], iframe[name*="paystack"], iframe[title*="Paystack"], iframe[id*="paystack"]',
                    );

                    if (!isSettled && !paystackFrame) {
                        console.error(
                            "[Paystack] V1 checkout iframe not detected after launch",
                            { reference },
                        );
                        finishProcessing();
                        const errorMessage =
                            "Payment could not be started. Please try again.";
                        toast({
                            title: "Payment Error",
                            description: errorMessage,
                            variant: "destructive",
                        });
                        config.onError?.(errorMessage);
                    }
                }, 8000);
                return;
            }

            if (!runtime.paystackV2Ctor) {
                throw new Error("No supported Paystack runtime available");
            }

            const popup = new runtime.paystackV2Ctor();
            const checkoutOptions = {
                key: sanitizedPublicKey,
                publicKey: sanitizedPublicKey,
                email: config.email,
                amount: amountInKobo,
                currency: "NGN",
                reference,
                metadata: config.metadata || {},
                channels: ["card", "bank", "bank_transfer", "ussd"],
                onLoad: () => {
                    console.log("[Paystack] V2 checkout loaded", { reference });
                    didLaunch = true;
                    clearLaunchWatchdog();
                },
                onCancel: () => {
                    console.log("[Paystack] V2 checkout closed by user", {
                        reference,
                    });
                    finishProcessing();
                    config.onClose?.();
                },
                onSuccess: (response: {
                    reference?: string;
                    status?: string;
                    message?: string;
                }) => {
                    console.log("[Paystack] V2 callback received", response);
                    finishProcessing();
                    if (response?.reference) {
                        config.onSuccess(response.reference);
                    } else {
                        const errorMessage =
                            response?.message ||
                            "Payment could not be processed. Please try again.";
                        toast({
                            title: "Payment Failed",
                            description: errorMessage,
                            variant: "destructive",
                        });
                        config.onError?.(errorMessage);
                    }
                },
                onError: (error: any) => {
                    console.error("[Paystack] V2 checkout error", error);
                    finishProcessing();
                    const errorMessage =
                        error?.message ||
                        error?.msg ||
                        "Payment could not be started. Please try again.";
                    toast({
                        title: "Payment Error",
                        description: errorMessage,
                        variant: "destructive",
                    });
                    config.onError?.(errorMessage);
                },
            };

            console.log("[Paystack] Opening v2 checkout", { reference });
            if (typeof popup.newTransaction === "function") {
                popup.newTransaction(checkoutOptions);
            } else if (typeof popup.checkout === "function") {
                popup.checkout(checkoutOptions);
            } else {
                throw new Error("Unsupported Paystack V2 runtime");
            }
            launchWatchdog = window.setTimeout(() => {
                if (!isSettled && !didLaunch) {
                    console.error(
                        "[Paystack] V2 checkout did not report load",
                        { reference },
                    );
                    finishProcessing();
                    const errorMessage =
                        "Payment could not be started. Please try again.";
                    toast({
                        title: "Payment Error",
                        description: errorMessage,
                        variant: "destructive",
                    });
                    config.onError?.(errorMessage);
                }
            }, 8000);
        } catch (error) {
            console.error("[Paystack] Payment error", error);
            setIsProcessing(false);
            const errorMessage =
                "Payment could not be started. Please try again.";
            toast({
                title: "Payment Error",
                description: errorMessage,
                variant: "destructive",
            });
            config.onError?.(errorMessage);
        }
    };

    return {
        initializePayment,
        isLoaded,
        isProcessing,
        loadError,
        isConfigured: isValidPaystackPublicKey(sanitizedPublicKey),
    };
};
