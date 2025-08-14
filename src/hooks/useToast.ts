import toast from "react-hot-toast";

export const useToast = () => {
  const success = (message: string) => {
    toast.success(message, {
      duration: 4000,
    });
  };

  const error = (message: string) => {
    toast.error(message, {
      duration: 5000,
    });
  };

  const loading = (message: string) => {
    return toast.loading(message, {
      duration: Infinity,
    });
  };

  const dismiss = (toastId: string) => {
    toast.dismiss(toastId);
  };

  const promise = <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, {
      loading,
      success,
      error,
    });
  };

  return {
    success,
    error,
    loading,
    dismiss,
    promise,
  };
};

