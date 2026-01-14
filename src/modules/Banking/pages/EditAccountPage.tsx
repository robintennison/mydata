// src/modules/Banking/pages/EditAccountPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardHeader, CardBody } from "../../../shared/components";
import { Button } from "../../../shared/components";
import { Input, TextArea } from "../../../shared/components";

const EditAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    acctCode: "",
    acctDetails: "",
    savingsAmount: "",
    mpin: "",
  });

  useEffect(() => {
    // TODO: Fetch account data by ID
    setTimeout(() => {
      setFormData({
        acctCode: "SBI1234",
        acctDetails: "State Bank of India",
        savingsAmount: "50000",
        mpin: "1234",
      });
      setLoading(false);
    }, 500);
  }, [id]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Update account logic
    console.log("Updating account:", formData);
    navigate("/banking/accounts");
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this account?")) {
      // TODO: Delete account logic
      console.log("Deleting account:", id);
      navigate("/banking/accounts");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
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
              onClick={() => navigate("/banking/accounts")}
            >
              ← Back
            </Button>
            <h1 className="text-xl font-bold">Edit Account</h1>
            <div className="w-10"></div>
          </div>
        </CardHeader>

        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Account Code"
              value={formData.acctCode}
              onChange={(e) => handleChange("acctCode", e.target.value)}
              required
              fullWidth
            />

            <TextArea
              label="Account Details"
              value={formData.acctDetails}
              onChange={(e) => handleChange("acctDetails", e.target.value)}
              rows={3}
              fullWidth
            />

            <Input
              label="Savings Amount"
              type="number"
              value={formData.savingsAmount}
              onChange={(e) => handleChange("savingsAmount", e.target.value)}
              startIcon="₹"
              fullWidth
            />

            <Input
              label="MPIN"
              type="password"
              value={formData.mpin}
              onChange={(e) => handleChange("mpin", e.target.value)}
              maxLength={4}
              fullWidth
            />

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/banking/accounts")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 border-red-300 flex-1"
              >
                Delete Account
              </Button>
              <Button type="submit" variant="primary" className="flex-1">
                Save Changes
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default EditAccountPage;
