import React, { useRef, useState } from "react";
import { useOnlineForm } from "./useOnlineForm";
import { useImageSize } from "../../../utils/imageSizeUtils";
import { formatFileSize } from "../../../utils/fileOptimizer";
import { ImageSizeBadge } from "../../../utils/imageSizeUtils";
import {
  formatDateDisplay,
  getFileIcon,
  getDaysInMonth,
  getFirstDayOfMonth,
  isToday,
  isSelectedDate,
} from "../../../utils/onlineFormHelpers";
import { FILE_TYPES } from "../types/online.types";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

const OnlineForm: React.FC = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [downloadingFile1, setDownloadingFile1] = useState(false);
  const [downloadingFile2, setDownloadingFile2] = useState(false);
  const [storage] = useState(() => getStorage());

  const {
    formData,
    setFormData,
    categories,
    loading,
    saving,
    deleting,
    uploadingFiles,
    file1Info,
    file2Info,
    showDelete,
    isAddMode,
    isEditMode,
    isViewMode,
    id,
    showCalendar,
    currentMonth,
    showYearSelector,
    openCalendar,
    selectDate,
    navigateMonth,
    navigateYear,
    selectYear,
    setShowCalendar,
    setShowYearSelector,
    handleSubmit,
    handleDelete,
    handleFileChange,
    handleRemoveFile,
    handleDeleteExistingFile,
    getPageTitle,
    navigate,
  } = useOnlineForm();

  const { size: file1Size, loading: loadingFile1Size } = useImageSize(
    formData.file1 && formData.file1Type === FILE_TYPES.IMAGE
      ? formData.file1
      : null,
  );

  const { size: file2Size, loading: loadingFile2Size } = useImageSize(
    formData.file2 && formData.file2Type === FILE_TYPES.IMAGE
      ? formData.file2
      : null,
  );

  // Helper function to extract path from Firebase Storage URL
  const extractPathFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Firebase Storage URLs have format: /v0/b/{bucket}/o/{path}?alt=media&token={token}
      const match = pathname.match(/\/o\/(.+)/);
      if (match) {
        // Decode the path (it's URL encoded)
        const encodedPath = match[1];
        return decodeURIComponent(encodedPath);
      }
      return url;
    } catch (e) {
      return url;
    }
  };

  // Helper function to generate appropriate filename
  const generateFilename = (
    fileNumber: 1 | 2,
    fileType: string,
    originalName?: string,
  ): string => {
    let filename = originalName || `File_${fileNumber}`;

    // Clean filename (remove special characters)
    filename = filename.replace(/[^a-zA-Z0-9_.-]/g, "_");

    // Try to get extension from URL if no original name
    if (!originalName) {
      const url = fileNumber === 1 ? formData.file1 : formData.file2;
      if (url) {
        const extensionMatch = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
        if (extensionMatch) {
          const ext = extensionMatch[1].toLowerCase();
          if (["jpg", "jpeg", "png", "gif", "webp", "pdf"].includes(ext)) {
            if (!filename.includes(".")) {
              return `${filename}.${ext}`;
            }
          }
        }
      }
    }

    // Add appropriate extension based on file type
    if (fileType === FILE_TYPES.IMAGE && !filename.includes(".")) {
      return `${filename}.jpg`;
    } else if (fileType === FILE_TYPES.PDF && !filename.includes(".")) {
      return `${filename}.pdf`;
    }

    return filename;
  };

  const handleDownload = async (fileNumber: 1 | 2) => {
    const fileUrl = fileNumber === 1 ? formData.file1 : formData.file2;
    const fileType =
      (fileNumber === 1 ? formData.file1Type : formData.file2Type) ||
      FILE_TYPES.NONE;
    const fileName = fileNumber === 1 ? formData.file1Name : formData.file2Name;

    if (!fileUrl) {
      alert("No file available to download.");
      return;
    }

    // Set downloading state
    if (fileNumber === 1) {
      setDownloadingFile1(true);
    } else {
      setDownloadingFile2(true);
    }

    try {
      let downloadUrl = fileUrl;

      // Check if it's a Firebase Storage URL
      if (fileUrl.includes("firebasestorage.googleapis.com")) {
        try {
          // Try to get a download URL using the Firebase Storage SDK
          // This bypasses CORS restrictions
          const storageRef = ref(storage, extractPathFromUrl(fileUrl));
          downloadUrl = await getDownloadURL(storageRef);
          console.log("Got download URL via SDK");
        } catch (storageError) {
          console.log(
            "Could not get download URL via SDK, using original URL",
            storageError,
          );
        }
      }

      // Create filename
      const filename = generateFilename(fileNumber, fileType, fileName);

      // Create a download link
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.target = "_blank"; // Open in new tab to avoid CORS issues
      link.download = filename;

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    } catch (error) {
      console.error(`Error downloading file ${fileNumber}:`, error);

      // Fallback method: Open the file in a new tab for manual download
      alert(
        `Could not automatically download the file. Opening in a new tab instead.\n\nYou can right-click and select "Save as..." to download it.`,
      );
      window.open(fileUrl, "_blank");
    } finally {
      // Reset downloading state
      if (fileNumber === 1) {
        setDownloadingFile1(false);
      } else {
        setDownloadingFile2(false);
      }
    }
  };

  const renderCalendarDays = () => {
    if (!showCalendar) return null;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="py-2.5"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isTodayDate = isToday(date);
      const selectedDate =
        showCalendar === "start" ? formData.startDate : formData.endDate;
      const isSelected = isSelectedDate(date, selectedDate);

      days.push(
        <button
          key={day}
          onClick={() => selectDate(date, showCalendar)}
          className={`py-2.5 bg-transparent border-none rounded text-sm transition-all ${
            isSelected
              ? "bg-blue-500 text-white font-semibold"
              : "text-gray-800 hover:bg-gray-100"
          } ${isTodayDate && !isSelected ? "border-2 border-blue-500" : ""}`}
          type="button"
        >
          {day}
        </button>,
      );
    }

    return days;
  };

  const renderYearSelector = () => {
    const currentYear = currentMonth.getFullYear();
    const startYear = currentYear - 6;
    const years = [];

    for (let year = startYear; year <= startYear + 12; year++) {
      years.push(
        <button
          key={year}
          onClick={() => selectYear(year)}
          className={`py-2.5 border-none rounded text-sm transition-all ${
            year === currentYear
              ? "bg-blue-500 text-white font-semibold"
              : "bg-transparent text-gray-800 hover:bg-gray-100"
          }`}
          type="button"
        >
          {year}
        </button>,
      );
    }

    return (
      <div className="max-h-72 overflow-y-auto p-2.5 grid grid-cols-4 gap-2">
        {years}
      </div>
    );
  };

  const renderFileSection = (fileNumber: 1 | 2) => {
    const fileInfo = fileNumber === 1 ? file1Info : file2Info;
    const existingFileUrl = fileNumber === 1 ? formData.file1 : formData.file2;
    const existingFileType =
      (fileNumber === 1 ? formData.file1Type : formData.file2Type) ||
      FILE_TYPES.NONE;
    const existingFileName =
      fileNumber === 1 ? formData.file1Name : formData.file2Name;
    const hasExistingFile = !!existingFileUrl;
    const hasNewFile = !!fileInfo.file;
    const fileSize = fileNumber === 1 ? file1Size : file2Size;
    const loadingSize = fileNumber === 1 ? loadingFile1Size : loadingFile2Size;
    const isDownloading =
      fileNumber === 1 ? downloadingFile1 : downloadingFile2;

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          File {fileNumber} {hasExistingFile && getFileIcon(existingFileType)}
        </label>

        {isViewMode ? (
          <div className="text-center">
            {hasExistingFile ? (
              <div className="relative">
                {existingFileType === FILE_TYPES.IMAGE ? (
                  <>
                    <img
                      src={existingFileUrl}
                      alt={`File ${fileNumber}`}
                      className="max-w-full max-h-48 rounded-lg border border-gray-300 mx-auto"
                    />
                    {/* Download button for image */}
                    <button
                      onClick={() => handleDownload(fileNumber)}
                      disabled={isDownloading}
                      className="absolute top-2 right-2 bg-black/70 text-white p-2 rounded-full hover:bg-black/90 transition-colors shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                      title="Download image"
                    >
                      {isDownloading ? "⏳" : "⬇️"}
                    </button>
                  </>
                ) : (
                  <div className="p-6 bg-gray-50 border border-gray-300 rounded-lg flex flex-col items-center relative">
                    <span className="text-4xl mb-2">📄</span>
                    <span className="text-sm font-medium text-gray-700 mb-1">
                      {existingFileName || "PDF Document"}
                    </span>
                    <div className="flex gap-3 mt-2">
                      <a
                        href={existingFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View PDF
                      </a>
                      <span className="text-gray-400">|</span>
                      <button
                        onClick={() => handleDownload(fileNumber)}
                        disabled={isDownloading}
                        className="text-green-600 hover:text-green-800 text-sm underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDownloading ? "Downloading..." : "Download PDF"}
                      </button>
                    </div>
                  </div>
                )}
                {existingFileType === FILE_TYPES.IMAGE && (
                  <ImageSizeBadge
                    size={fileSize}
                    loading={loadingSize}
                    position="overlay"
                  />
                )}
              </div>
            ) : (
              <div className="p-10 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-gray-500 text-sm">
                No file
              </div>
            )}
            {hasExistingFile && existingFileType === FILE_TYPES.IMAGE && (
              <div className="mt-2 flex justify-center gap-4">
                <ImageSizeBadge
                  size={fileSize}
                  loading={loadingSize}
                  position="below"
                />
                <button
                  onClick={() => handleDownload(fileNumber)}
                  disabled={isDownloading}
                  className="text-blue-600 hover:text-blue-800 text-sm underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloading ? "⏳ Downloading..." : "⬇️ Download"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <input
              id={`file${fileNumber}Input`}
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => handleFileChange(e, fileNumber)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              disabled={saving || deleting || uploadingFiles}
            />

            {fileInfo.error && (
              <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                ⚠️ {fileInfo.error}
              </div>
            )}

            {fileInfo.optimization &&
              fileInfo.optimization.savedPercentage > 0 && (
                <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex flex-col text-green-800 text-xs">
                    <div className="flex items-center gap-1 font-medium mb-1">
                      <span>🎯</span>
                      <span>
                        {fileInfo.optimization.savedPercentage.toFixed(1)}%
                        space saved
                      </span>
                    </div>
                    <div className="font-mono text-xs">
                      {formatFileSize(fileInfo.optimization.originalSize)} →{" "}
                      {formatFileSize(fileInfo.optimization.optimizedSize)}
                    </div>
                  </div>
                </div>
              )}

            <div className="space-y-3">
              {hasExistingFile && !hasNewFile && (
                <div className="relative">
                  {existingFileType === FILE_TYPES.IMAGE ? (
                    <>
                      <img
                        src={existingFileUrl}
                        alt={`Current File ${fileNumber}`}
                        className="max-w-full max-h-36 rounded-lg border border-gray-300"
                      />
                      <ImageSizeBadge
                        size={fileSize}
                        loading={loadingSize}
                        position="overlay"
                      />
                    </>
                  ) : (
                    <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700">
                          {existingFileName || "PDF Document"}
                        </div>
                        <a
                          href={existingFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs underline"
                        >
                          View PDF
                        </a>
                      </div>
                    </div>
                  )}
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteExistingFile(fileNumber)}
                      disabled={saving || deleting || uploadingFiles}
                      className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-xs font-medium hover:bg-red-100 disabled:opacity-50"
                    >
                      Delete{" "}
                      {existingFileType === FILE_TYPES.IMAGE ? "Image" : "PDF"}
                    </button>
                  </div>
                </div>
              )}

              {hasNewFile && fileInfo.file && (
                <div className="relative">
                  {fileInfo.type === FILE_TYPES.IMAGE ? (
                    <img
                      src={URL.createObjectURL(fileInfo.file)}
                      alt={`New File ${fileNumber}`}
                      className="max-w-full max-h-36 rounded-lg border border-gray-300"
                    />
                  ) : (
                    <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700">
                          {fileInfo.file.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          PDF Document • {formatFileSize(fileInfo.file.size)}
                        </div>
                      </div>
                    </div>
                  )}

                  {fileInfo.type === FILE_TYPES.IMAGE && (
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      <span className="font-medium">
                        {formatFileSize(fileInfo.file.size)}
                      </span>
                    </div>
                  )}

                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(fileNumber)}
                      disabled={saving || deleting || uploadingFiles}
                      className="px-3 py-1 bg-gray-50 text-gray-700 border border-gray-300 rounded text-xs font-medium hover:bg-gray-100 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {hasExistingFile &&
              !hasNewFile &&
              existingFileType === FILE_TYPES.IMAGE && (
                <div className="mt-2 text-center">
                  <ImageSizeBadge
                    size={fileSize}
                    loading={loadingSize}
                    position="below"
                  />
                </div>
              )}
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-gray-50 flex flex-col">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center">
            <button
              onClick={() =>
                navigate("/online", { state: { activeTab: "items" } })
              }
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Back"
            >
              ←
            </button>
            <div className="ml-4">
              <h1 className="text-lg font-semibold text-gray-900">
                {getPageTitle()}
              </h1>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading item...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() =>
                navigate("/online", { state: { activeTab: "items" } })
              }
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Back"
            >
              ←
            </button>
            <div className="ml-4">
              <h1 className="text-lg font-semibold text-gray-900">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          {isViewMode && showDelete && (
            <button
              onClick={() =>
                navigate(`/online/items/edit/${id}`, {
                  state: { returnTo: "/online", activeTab: "items" },
                })
              }
              className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              title="Edit this item"
            >
              ✏️ Edit
            </button>
          )}
        </div>
      </div>

      {/* Form/View Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Name {!isViewMode && "*"}
              </label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) =>
                  !isViewMode &&
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  isViewMode ? "bg-gray-50 cursor-default" : "bg-white"
                } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                placeholder="Enter item name"
                required={!isViewMode}
                disabled={isViewMode || saving || deleting || uploadingFiles}
                readOnly={isViewMode}
                autoFocus={!isViewMode}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              {isViewMode ? (
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 min-h-[40px] flex items-center">
                  {formData.category || "Not specified"}
                </div>
              ) : (
                <select
                  value={formData.category || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={saving || deleting || uploadingFiles}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Date Range Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date {!isViewMode && "(Optional)"}
                </label>
                {isViewMode ? (
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 min-h-[40px] flex items-center">
                    {formatDateDisplay(formData.startDate)}
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={formatDateDisplay(formData.startDate)}
                      readOnly
                      onClick={() => openCalendar("start")}
                      className="date-input w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition cursor-pointer pr-10"
                      placeholder="Select start date"
                    />
                    <button
                      onClick={() => openCalendar("start")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 p-1"
                      title="Pick start date"
                      type="button"
                    >
                      📅
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date {!isViewMode && "(Optional)"}
                </label>
                {isViewMode ? (
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 min-h-[40px] flex items-center">
                    {formatDateDisplay(formData.endDate)}
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={formatDateDisplay(formData.endDate)}
                      readOnly
                      onClick={() => openCalendar("end")}
                      className="date-input w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition cursor-pointer pr-10"
                      placeholder="Select end date"
                    />
                    <button
                      onClick={() => openCalendar("end")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 p-1"
                      title="Pick end date"
                      type="button"
                    >
                      📅
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Calendar Popup */}
            {showCalendar && !isViewMode && (
              <div
                id="calendar-popup"
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-300 rounded-xl shadow-2xl z-[10001] p-5 w-[90%] max-w-sm max-h-[80vh] overflow-hidden"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigateYear("prev")}
                      className="px-2.5 py-1.5 border border-gray-300 rounded text-sm text-gray-700 min-w-10 hover:bg-gray-50"
                      title="Previous Year"
                      type="button"
                    >
                      &lt;&lt;
                    </button>
                    <button
                      onClick={() => navigateMonth("prev")}
                      className="px-2.5 py-1.5 border border-gray-300 rounded text-sm text-gray-700 min-w-10 hover:bg-gray-50"
                      title="Previous Month"
                      type="button"
                    >
                      &lt;
                    </button>
                  </div>

                  <button
                    onClick={() => setShowYearSelector(!showYearSelector)}
                    className="px-2 py-1 text-sm font-semibold text-gray-800 hover:bg-gray-100 rounded"
                    title="Select Year"
                    type="button"
                  >
                    {currentMonth.toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigateMonth("next")}
                      className="px-2.5 py-1.5 border border-gray-300 rounded text-sm text-gray-700 min-w-10 hover:bg-gray-50"
                      title="Next Month"
                      type="button"
                    >
                      &gt;
                    </button>
                    <button
                      onClick={() => navigateYear("next")}
                      className="px-2.5 py-1.5 border border-gray-300 rounded text-sm text-gray-700 min-w-10 hover:bg-gray-50"
                      title="Next Year"
                      type="button"
                    >
                      &gt;&gt;
                    </button>
                  </div>
                </div>

                {showYearSelector ? (
                  renderYearSelector()
                ) : (
                  <>
                    <div className="grid grid-cols-7 mb-2">
                      {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                        <div
                          key={day}
                          className="text-center text-xs text-gray-500 font-medium py-1"
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {renderCalendarDays()}
                    </div>
                  </>
                )}

                <div className="flex justify-center gap-2.5 mt-4">
                  <button
                    onClick={() => {
                      const today = new Date();
                      selectDate(today, showCalendar);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                    type="button"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      setShowCalendar(null);
                      setShowYearSelector(false);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                    type="button"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        [showCalendar === "start" ? "startDate" : "endDate"]:
                          null,
                      }));
                      setShowCalendar(null);
                      setShowYearSelector(false);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                    type="button"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* DETAILS FIELD */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Details
              </label>
              {isViewMode ? (
                <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 whitespace-pre-wrap break-words overflow-auto min-h-[80px] leading-relaxed">
                  {formData.detail || "No details provided"}
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  value={formData.detail || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, detail: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-y min-h-[150px] disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter item details"
                  disabled={saving || deleting || uploadingFiles}
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderFileSection(1)}
              {renderFileSection(2)}
            </div>

            {/* Timestamps */}
            {isViewMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Created
                  </label>
                  <div className="text-sm text-gray-900">
                    {formatDateDisplay(formData.createdAt)}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Last Updated
                  </label>
                  <div className="text-sm text-gray-900">
                    {formatDateDisplay(formData.updatedAt)}
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            {!isViewMode && (
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/online", { state: { activeTab: "items" } })
                    }
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                    disabled={saving || deleting || uploadingFiles}
                  >
                    Cancel
                  </button>

                  {isEditMode && showDelete && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                      disabled={saving || deleting || uploadingFiles}
                    >
                      {deleting ? "Deleting..." : "Delete"}
                    </button>
                  )}

                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                    disabled={saving || deleting || uploadingFiles}
                  >
                    {saving || uploadingFiles
                      ? "Saving..."
                      : isAddMode
                        ? "Add Item"
                        : "Update"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnlineForm;
