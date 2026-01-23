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
import styles from "./Online.module.css";

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
        renewalsList.push({
          id: doc.id,
          ...doc.data(),
        } as Renewal);
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
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading renewals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTopRow}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Renewals</h1>
            <p className={styles.subtitle}>Manage your subscription renewals</p>
          </div>
          <div className={styles.headerRight}>
            <button
              className={styles.addButton}
              onClick={() => navigate("/online/renewals/add")}
            >
              + Add Renewal
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search renewals..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <span className={styles.searchIcon}>🔍</span>
      </div>

      {/* Renewals List */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            Renewals ({filteredRenewals.length})
          </div>
        </div>

        {filteredRenewals.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔄</div>
            <div className={styles.emptyText}>No renewals found</div>
            <div className={styles.emptySubtext}>
              {searchTerm
                ? "Try a different search term"
                : "Add your first renewal"}
            </div>
          </div>
        ) : (
          <div className={styles.tableResponsiveContainer}>
            <table className={styles.responsiveTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Days Left</th>
                  <th>Comments</th>
                  <th style={{ width: "150px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRenewals.map((renewal) => {
                  const daysLeft = getDaysUntil(renewal.endDate);
                  const isExpiringSoon = daysLeft <= 30;
                  const isExpired = daysLeft < 0;

                  return (
                    <tr
                      key={renewal.id}
                      className={
                        isExpiringSoon
                          ? styles.warningRow
                          : isExpired
                            ? styles.expiredRow
                            : ""
                      }
                    >
                      <td>{renewal.name}</td>
                      <td>{formatDate(renewal.startDate)}</td>
                      <td>{formatDate(renewal.endDate)}</td>
                      <td>
                        <span
                          className={
                            isExpired
                              ? styles.expiredBadge
                              : isExpiringSoon
                                ? styles.warningBadge
                                : styles.normalBadge
                          }
                        >
                          {isExpired ? "Expired" : `${daysLeft} days`}
                        </span>
                      </td>
                      <td>
                        <div
                          className={styles.truncateText}
                          title={renewal.comments}
                        >
                          {renewal.comments && renewal.comments.length > 50
                            ? `${renewal.comments.substring(0, 50)}...`
                            : renewal.comments || "-"}
                        </div>
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            className={styles.editButton}
                            onClick={() =>
                              navigate(`/online/renewals/edit/${renewal.id}`)
                            }
                          >
                            Edit
                          </button>
                          <button
                            className={styles.deleteButton}
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
