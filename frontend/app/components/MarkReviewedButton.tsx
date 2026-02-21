"use client";

import { useState } from "react";

export default function MarkReviewedButton() {
  const [reviewed, setReviewed] = useState(false);

  return reviewed ? (
    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded text-sm text-green-700 font-medium">
      ✓ Marked as Reviewed
    </div>
  ) : (
    <button
      onClick={() => setReviewed(true)}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
    >
      Mark as Reviewed
    </button>
  );
}
