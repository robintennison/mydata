import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBankingData } from "../hooks/useBankingData";

const EditHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { month } = useParams();
  const { loading, history } = useBankingData();

  const [formMonth, setFormMonth] = useState("");
  const [formTotalDeposits, setFormTotalDeposits] = useState("");
  const [formSavings, setFormSavings] = useState("");

  // Load record data when component mounts
  useEffect(() => {
    if (month && history.length > 0) {
      const record = history.find((h) => h.month === month);
      if (record) {
        setFormMonth(record.month);
        setFormTotalDeposits(record.totalDeposits.toString());
        setFormSavings(record.savings.toString());
      }
    }
  }, [month, history]);

  const handleSave = () => {
    if (formMonth && formTotalDeposits && formSavings) {
      const updatedRecord = {
        month: formMonth,
        totalDeposits: parseFloat(formTotalDeposits) || 0,
        savings: parseFloat(formSavings) || 0,
      };

      // TODO: Save to Firebase
      console.log("Updating history record:", updatedRecord);

      // ALWAYS navigate back to banking with history tab active
      navigate("/banking", {
        state: { activeTab: "history" },
        replace: true,
      });
    }
  };

  const handleCancel = () => {
    // ALWAYS navigate back to banking with history tab active
    navigate("/banking", {
      state: { activeTab: "history" },
      replace: true,
    });
  };

  const canSave = formMonth && formTotalDeposits && formSavings;

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-gray-50 min-h-screen">
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-5 shadow-lg">
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <div className="flex items-center flex-1">
            <button
              onClick={handleCancel}
              className="bg-transparent border-none text-white text-2xl cursor-pointer mr-3 p-1 hover:bg-white/20 rounded-lg transition-colors"
              title="Go Back"
            >
              ←
            </button>
            <h1 className="text-xl font-bold">
              {month ? "Banking / Edit History" : "Banking / Add History"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${
                canSave
                  ? "bg-white/20 text-white hover:bg-white/30 cursor-pointer"
                  : "bg-white/10 text-white/50 cursor-not-allowed"
              }`}
              title="Save"
            >
              ✓
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 mb-4">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month (e.g. 2025-09)
              </label>
              <input
                type="text"
                value={formMonth}
                onChange={(e) => setFormMonth(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition disabled:bg-gray-100"
                disabled={!!month}
                placeholder="YYYY-MM"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Deposits
              </label>
              <input
                type="number"
                value={formTotalDeposits}
                onChange={(e) => setFormTotalDeposits(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Savings
              </label>
              <input
                type="number"
                value={formSavings}
                onChange={(e) => setFormSavings(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="h-5"></div>
    </div>
  );
};

export default EditHistoryPage;
