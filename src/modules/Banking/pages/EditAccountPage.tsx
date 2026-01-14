// src/modules/Banking/pages/EditAccountPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardHeader, CardBody } from "../../../shared/components";
import { Button } from "../../../shared/components";
import { Input, TextArea } from "../../../shared/components";
import { useBankingOperations } from "../hooks/useBankingOperations"; // Import the hook

// Define BankAccount type matching your banking.types
interface BankAccount {
  id: string; // Required
  acctCode: string;
  acctDetails: string;
  savingsAmount: number;
  mpin: string;
}

// Define types for form data
interface AccountFormData {
  acctCode: string;
  acctDetails: string;
  savingsAmount: string;
  mpin: string;
}

// Mock fetch function - should be replaced with actual Firestore call
const fetchAccountData = async (id: string): Promise<BankAccount> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    id: id,
    acctCode: "SBI1234",
    acctDetails: "State Bank of India",
    savingsAmount: 50000,
    mpin: "1234",
  };
};

const EditAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { handleSaveAccount, handleDeleteAccount } = useBankingOperations(); // Use the hook

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState<AccountFormData>({
    acctCode: "",
    acctDetails: "",
    savingsAmount: "",
    mpin: "",
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch account data on component mount
  useEffect(() => {
    const loadAccountData = async () => {
      if (!id) {
        setError("Account ID is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await fetchAccountData(id);
        setAccount(data);

        setFormData({
          acctCode: data.acctCode,
          acctDetails: data.acctDetails,
          savingsAmount: data.savingsAmount.toString(),
          mpin: data.mpin,
        });
      } catch (err) {
        console.error("Failed to fetch account data:", err);
        setError("Failed to load account data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadAccountData();
  }, [id]);

  // Handle form input changes
  const handleChange = useCallback(
    (field: keyof AccountFormData, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  // Validate form data
  const validateForm = (data: AccountFormData): boolean => {
    if (!data.acctCode.trim()) {
      setError("Account Code is required");
      return false;
    }
    if (!data.acctDetails.trim()) {
      setError("Account Details are required");
      return false;
    }
    const amount = parseFloat(data.savingsAmount);
    if (isNaN(amount) || amount < 0) {
      setError("Please enter a valid savings amount");
      return false;
    }
    if (data.mpin.length !== 4) {
      setError("MPIN must be exactly 4 digits");
      return false;
    }
    if (!/^\d{4}$/.test(data.mpin)) {
      setError("MPIN must be 4 numbers only");
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !account) return;

    if (!validateForm(formData)) return;

    try {
      setSubmitting(true);

      // Prepare account data with the ID for update
      const accountData: BankAccount = {
        id: id, // REQUIRED: Must pass the ID for updates
        acctCode: formData.acctCode.trim(),
        acctDetails: formData.acctDetails.trim(),
        savingsAmount: parseFloat(formData.savingsAmount) || 0,
        mpin: formData.mpin,
      };

      console.log("Updating account with data:", accountData);

      // Call the save account function from hook
      await handleSaveAccount(accountData);

      // Note: handleSaveAccount calls window.location.reload() after saving
      // So we don't need to navigate manually
    } catch (err) {
      console.error("Update error:", err);
      setError("Failed to update account. Please try again.");
      setSubmitting(false);
    }
  };

  // Handle account deletion
  const handleDelete = async () => {
    if (!id) return;

    if (
      !window.confirm(
        "Are you sure you want to delete this account? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeleting(true);

      // Call the delete account function from hook
      await handleDeleteAccount(id);

      // Note: handleDeleteAccount calls window.location.reload() after deleting
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete account. Please try again.");
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    const hasChanges =
      account &&
      (formData.acctCode !== account.acctCode ||
        formData.acctDetails !== account.acctDetails ||
        formData.savingsAmount !== account.savingsAmount.toString() ||
        formData.mpin !== account.mpin);

    if (hasChanges) {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmLeave) return;
    }

    navigate("/banking/accounts");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Loading account details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={submitting || deleting}
              className="px-4 py-2"
            >
              ← Back
            </Button>
            <h1 className="text-xl font-bold text-gray-800">
              Edit Account {id && `#${id.slice(-4)}`}
            </h1>
            <div className="w-16"></div>
          </div>
        </CardHeader>

        <CardBody>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center text-red-700">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Input
                label="Account Code *"
                value={formData.acctCode}
                onChange={(e) => handleChange("acctCode", e.target.value)}
                required
                fullWidth
                disabled={submitting || deleting}
                placeholder="e.g., SBI1234"
                className="bg-white"
              />

              <TextArea
                label="Account Details *"
                value={formData.acctDetails}
                onChange={(e) => handleChange("acctDetails", e.target.value)}
                rows={3}
                fullWidth
                disabled={submitting || deleting}
                placeholder="Bank name, branch, account type, etc."
                className="bg-white"
              />

              <Input
                label="Savings Amount (₹) *"
                type="number"
                value={formData.savingsAmount}
                onChange={(e) => handleChange("savingsAmount", e.target.value)}
                startIcon="₹"
                fullWidth
                disabled={submitting || deleting}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="bg-white"
              />

              <Input
                label="MPIN (4 digits) *"
                type="password"
                value={formData.mpin}
                onChange={(e) => handleChange("mpin", e.target.value)}
                maxLength={4}
                fullWidth
                disabled={submitting || deleting}
                pattern="\d{4}"
                title="Enter 4-digit MPIN"
                placeholder="1234"
                className="bg-white tracking-widest"
              />
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                className="flex-1 py-3"
                disabled={submitting || deleting}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                className="flex-1 py-3 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                disabled={submitting || deleting}
              >
                {deleting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600 mr-2"></div>
                    Deleting...
                  </div>
                ) : (
                  "Delete Account"
                )}
              </Button>

              <Button
                type="submit"
                variant="primary"
                className="flex-1 py-3"
                disabled={submitting || deleting}
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default EditAccountPage;
