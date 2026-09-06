import { useEffect, useState } from "react";
import { subscribeToSlowRequests } from "../lib/requestActivity";

// A quiet strip that appears only when the API has kept us waiting longer
// than a working server would. On free hosting the container sleeps after
// about fifteen minutes idle and takes roughly thirty seconds to start, and
// without this the site simply looks broken for that half minute.
//
// role="status" rather than an alert: this is progress information, not a
// problem, so a screen reader should mention it without interrupting.
const ServerWakingNotice = () => {
  const [waking, setWaking] = useState(false);

  useEffect(() => subscribeToSlowRequests(setWaking), []);

  if (!waking) return null;

  return (
    <div className="waking" role="status" aria-live="polite">
      <span className="waking__spinner" aria-hidden="true" />
      <span>
        Waking the server up. Free hosting puts it to sleep when nobody has
        visited for a while, so the first page can take up to half a minute.
      </span>
    </div>
  );
};

export default ServerWakingNotice;
