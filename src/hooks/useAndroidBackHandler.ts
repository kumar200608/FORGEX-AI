import { useEffect } from 'react';

/**
 * useAndroidBackHandler
 *
 * Intercepts Android physical/gesture back button (popstate)
 * when a modal or drawer is active, closing the modal instead of
 * navigating back in browser history or exiting the Android APK.
 */
export function useAndroidBackHandler(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    // Push a dummy history state when modal opens
    const stateId = `modal-${Date.now()}`;
    window.history.pushState({ modalOpen: stateId }, '');

    const handlePopState = () => {
      // Android back button pressed! Close modal gracefully.
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Clean up the dummy state if modal was closed via UI button instead of back button
      if (window.history.state?.modalOpen === stateId) {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);
}
