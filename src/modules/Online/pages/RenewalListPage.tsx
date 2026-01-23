import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Renewal } from "../types/online.types";
import { onlineStyles } from "../styles/onlineStyles";

const RenewalListPage: React.FC = () => {
  const navigate = useNavigate();
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchRenewals();
  }, []);

  const fetchRenewals = async () => {
    try {
      setLoading(true);
      const db = getFirestore();
      const renewalsRef = collection(db, "renewals");
      const snapshot = await getDocs(renewalsRef);

      const renewalsList: Renewal[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        renewalsList.push({
          id: doc.id,
          name: data.name || "",
          startDate: data.startDate || Date.now(),
          endDate: data.endDate || Date.now(),
          comments: data.comments || "",
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
        });
      });

      // Sort by end date (soonest first)
      renewalsList.sort((a, b) => a.endDate - b.endDate);
      setRenewals(renewalsList);
    } catch (error) {
      console.error("Error fetching renewals:", error);
      alert("Failed to load renewals");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete renewal "${name}"?`)) {
      try {
        const db = getFirestore();
        await deleteDoc(doc(db, "renewals", id));
        setRenewals(renewals.filter((renewal) => renewal.id !== id));
      } catch (error) {
        console.error("Error deleting renewal:", error);
        alert("Failed to delete renewal");
      }
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getDaysUntil = (endDate: number) => {
    const now = Date.now();
    const diff = endDate - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const filteredRenewals = renewals.filter(
    (renewal) =>
      renewal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (renewal.comments &&
        renewal.comments.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  if (loading) {
    return (
      <div style={onlineStyles.container}>
        <div style={onlineStyles.loading}>
          <div style={onlineStyles.spinner}></div>
          <p>Loading renewals...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={onlineStyles.container}>
      {/* Top Navigation */}
      <div style={onlineStyles.topNav}>
        <button
          onClick={() => navigate("/online")}
          style={onlineStyles.navButton}
          title="Back"
        >
          ←
        </button>
        <div style={onlineStyles.headerLeft}>
          <div style={onlineStyles.navTitle}>Renewals</div>
          <div style={onlineStyles.navSubtitle}>
            Manage your subscription renewals
          </div>
        </div>
        <div style={onlineStyles.headerRight}>
          <button
            style={onlineStyles.addButton}
            onClick={() => navigate("/online/renewals/add")}
          >
            + Add Renewal
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={onlineStyles.searchContainer}>
        <input
          type="text"
          placeholder="Search renewals..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={onlineStyles.searchInput}
        />
        <span style={onlineStyles.searchIcon}>🔍</span>
      </div>

      {/* Renewals List */}
      <div style={onlineStyles.section}>
        <div style={onlineStyles.sectionHeader}>
          <div style={onlineStyles.sectionTitle}>
            Renewals ({filteredRenewals.length})
          </div>
        </div>

        {filteredRenewals.length === 0 ? (
          <div style={onlineStyles.emptyState}>
            <div style={onlineStyles.emptyIcon}>🔄</div>
            <div style={onlineStyles.emptyText}>No renewals found</div>
            <div style={onlineStyles.emptySubtext}>
              {searchTerm
                ? "Try a different search term"
                : "Add your first renewal"}
            </div>
          </div>
        ) : (
          <div style={onlineStyles.tableResponsiveContainer}>
            <table style={onlineStyles.responsiveTable}>
              <thead>
                <tr>
                  <th style={onlineStyles.tableHeader}>Name</th>
                  <th style={onlineStyles.tableHeader}>Start Date</th>
                  <th style={onlineStyles.tableHeader}>End Date</th>
                  <th style={onlineStyles.tableHeader}>Days Left</th>
                  <th style={onlineStyles.tableHeader}>Comments</th>
                  <th style={{ ...onlineStyles.tableHeader, width: "150px" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRenewals.map((renewal) => {
                  const daysLeft = getDaysUntil(renewal.endDate);
                  const isExpiringSoon = daysLeft <= 30;
                  const isExpired = daysLeft < 0;
                  const rowStyle = isExpired
                    ? { ...onlineStyles.tableRow, ...onlineStyles.expiredRow }
                    : isExpiringSoon
                      ? { ...onlineStyles.tableRow, ...onlineStyles.warningRow }
                      : onlineStyles.tableRow;

                  return (
                    <tr key={renewal.id} style={rowStyle}>
                      <td style={onlineStyles.tableCell}>{renewal.name}</td>
                      <td style={onlineStyles.tableCell}>
                        {formatDate(renewal.startDate)}
                      </td>
                      <td style={onlineStyles.tableCell}>
                        {formatDate(renewal.endDate)}
                      </td>
                      <td style={onlineStyles.tableCell}>
                        <span
                          style={
                            isExpired
                              ? onlineStyles.expiredBadge
                              : isExpiringSoon
                                ? onlineStyles.warningBadge
                                : onlineStyles.normalBadge
                          }
                        >
                          {isExpired ? "Expired" : `${daysLeft} days`}
                        </span>
                      </td>
                      <td style={onlineStyles.tableCell}>
                        <div
                          style={onlineStyles.truncateText}
                          title={renewal.comments}
                        >
                          {renewal.comments && renewal.comments.length > 50
                            ? `${renewal.comments.substring(0, 50)}...`
                            : renewal.comments || "-"}
                        </div>
                      </td>
                      <td style={onlineStyles.tableCell}>
                        <div style={onlineStyles.actionButtons}>
                          <button
                            style={onlineStyles.editButton}
                            onClick={() =>
                              navigate(`/online/renewals/edit/${renewal.id}`)
                            }
                          >
                            Edit
                          </button>
                          <button
                            style={onlineStyles.deleteButton}
                            onClick={() =>
                              handleDelete(renewal.id, renewal.name)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RenewalListPage;
