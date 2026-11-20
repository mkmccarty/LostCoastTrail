import { useEffect, useMemo, useState } from 'react';
import {
  Direction,
  getItinerary,
  ItineraryDayTemplate,
  splitItineraryForZone,
} from './data/trailData';
import { addDaysYMD, formatYMD } from './utils/permitUtils';
import { fetchShelterCoveTides, TideFetchResult } from './utils/tideService';
import { evaluateCandidateDates } from './utils/tripScorer';
import { CoastalMap } from './components/CoastalMap';
import { TideChart } from './components/TideChart';
import { ItinerarySchedule } from './components/ItinerarySchedule';
import { PermitPlannerCard } from './components/PermitPlannerCard';
import { TrailChecklistCard } from './components/TrailChecklistCard';
import { BestDatesStrip } from './components/BestDatesStrip';
import { AlmanacCard } from './components/AlmanacCard';
import { DisclaimerModal } from './components/DisclaimerModal';
import { AnnualCalendarModal } from './components/AnnualCalendarModal';
import {
  Mountain,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Loader2,
  AlertCircle,
  Calendar,
} from 'lucide-react';

export function App() {
  // Default to 90 days from today (prime permit-planning target)
  const [startDateStr, setStartDateStr] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return formatYMD(d);
  });
  const [tripDays, setTripDays] = useState<number>(3);
  const [direction, setDirection] = useState<Direction>('N_TO_S');
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(9 * 60); // 9:00 AM

  const [tideResult, setTideResult] = useState<TideFetchResult | null>(null);
  const [loadingTides, setLoadingTides] = useState<boolean>(true);
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false);
  const [customItinerary, setCustomItinerary] = useState<ItineraryDayTemplate[] | null>(null);

  // Reset custom split when tripDays or direction changes
  useEffect(() => {
    setCustomItinerary(null);
  }, [tripDays, direction]);

  const itinerary = useMemo(
    () => customItinerary ?? getItinerary(tripDays, direction),
    [customItinerary, tripDays, direction]
  );

  const effectiveDays = itinerary.length;

  const windowBeginStr = useMemo(
    () => addDaysYMD(startDateStr, -3),
    [startDateStr]
  );
  const windowEndStr = useMemo(
    () => addDaysYMD(startDateStr, 3 + effectiveDays - 1),
    [startDateStr, effectiveDays]
  );

  // Clamp selectedDayIdx when itinerary shrinks
  useEffect(() => {
    if (selectedDayIdx >= effectiveDays) {
      setSelectedDayIdx(effectiveDays - 1);
    }
  }, [effectiveDays, selectedDayIdx]);

  // Fetch NOAA Shelter Cove tides for the 7-day candidate window + trip duration
  useEffect(() => {
    let cancelled = false;
    setLoadingTides(true);
    fetchShelterCoveTides(windowBeginStr, windowEndStr).then((res) => {
      if (!cancelled) {
        setTideResult(res);
        setLoadingTides(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [windowBeginStr, windowEndStr]);

  const candidateDates = useMemo(
    () =>
      evaluateCandidateDates(
        startDateStr,
        tripDays,
        direction,
        tideResult?.byDate ?? {}
      ),
    [startDateStr, tripDays, direction, tideResult]
  );

  const handleSplitDayForZone = (
    dayIdx: number,
    zoneId: 'zone-1' | 'zone-2' | 'zone-3'
  ) => {
    const next = splitItineraryForZone(itinerary, dayIdx, zoneId, direction);
    setCustomItinerary(next);
    setSelectedDayIdx(Math.min(dayIdx + 1, next.length - 1));
  };

  const activeDay = itinerary[selectedDayIdx] ?? itinerary[0];
  const activeDateStr = addDaysYMD(startDateStr, selectedDayIdx);
  const activeDayTide = tideResult?.byDate[activeDateStr];

  // Current height & slope at selectedMinutes
  const currentTideSample = useMemo(() => {
    if (!activeDayTide || activeDayTide.points.length === 0) {
      return { heightFt: null, slopeFtPerHr: 0 };
    }
    const closest = activeDayTide.points.reduce((best, p) =>
      Math.abs(p.minutes - selectedMinutes) < Math.abs(best.minutes - selectedMinutes) ? p : best
    );
    return { heightFt: closest.heightFt, slopeFtPerHr: closest.slopeFtPerHr };
  }, [activeDayTide, selectedMinutes]);

  const handleSelectDay = (idx: number, jumpMinutes?: number) => {
    setSelectedDayIdx(idx);
    if (jumpMinutes !== undefined) {
      setSelectedMinutes(jumpMinutes);
    }
  };

  const shiftStartDate = (delta: number) => {
    setStartDateStr((prev) => addDaysYMD(prev, delta));
  };

  const jumpToTodayPlus = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setStartDateStr(formatYMD(d));
    setSelectedDayIdx(0);
  };

  return (
    <div className="app-shell">
      <DisclaimerModal />
      <AnnualCalendarModal
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        selectedStartDateStr={startDateStr}
        tripDays={tripDays}
        direction={direction}
        onChangeDirection={setDirection}
        onSelectStartDate={(ymd) => {
          setStartDateStr(ymd);
          setSelectedDayIdx(0);
        }}
      />
      {/* Header */}
      <header className="top-header">
        <div className="brand-title">
          <div className="brand-icon">
            <Mountain size={22} />
          </div>
          <div>
            <h1>Lost Coast Trail · Tide &amp; Permit Planner</h1>
            <div className="brand-subtitle">
              King Range Wilderness · NOAA Station 9418024 (Shelter Cove) · Recreation.gov #445864
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {loadingTides && (
            <span className="badge badge-ocean">
              <Loader2 size={12} className="spin" /> Fetching NOAA Tides…
            </span>
          )}
          {tideResult?.error && (
            <span className="badge badge-tight" title={tideResult.error}>
              <AlertCircle size={12} /> Offline Tide Estimate
            </span>
          )}
        </div>
      </header>

      {/* Controls Bar */}
      <div className="controls-bar">
        {/* Start Date Navigation */}
        <div className="control-group">
          <span className="control-label">Start Date</span>
          <button
            type="button"
            className="btn btn-icon"
            title="Previous day"
            onClick={() => shiftStartDate(-1)}
          >
            <ChevronLeft size={16} />
          </button>
          <input
            type="date"
            className="date-input"
            value={startDateStr}
            onChange={(e) => {
              if (e.target.value) setStartDateStr(e.target.value);
            }}
          />
          <button
            type="button"
            className="btn btn-icon"
            title="Next day"
            onClick={() => shiftStartDate(1)}
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            className="btn"
            style={{ fontSize: '0.76rem', padding: '5px 8px' }}
            onClick={() => jumpToTodayPlus(0)}
          >
            Today
          </button>
          <button
            type="button"
            className="btn"
            style={{ fontSize: '0.76rem', padding: '5px 8px' }}
            onClick={() => jumpToTodayPlus(90)}
            title="Jump to 90 days from today (when permits open at 7 AM PT)"
          >
            +90d (Permit Edge)
          </button>
          <button
            type="button"
            className="btn btn-active"
            style={{ fontSize: '0.76rem', padding: '5px 9px' }}
            onClick={() => setCalendarOpen(true)}
            title="View full-year daily star ratings & moon phases"
          >
            <Calendar size={13} /> Annual Calendar
          </button>
        </div>

        <div className="divider-v" />

        {/* Trip Duration (2 to 6 Days) */}
        <div className="control-group">
          <span className="control-label">Trip Length</span>
          <div className="segmented">
            {[2, 3, 4, 5, 6].map((d) => (
              <button
                key={d}
                type="button"
                className={tripDays === d ? 'active' : ''}
                onClick={() => setTripDays(d)}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        <div className="divider-v" />

        {/* Hiking Direction */}
        <div className="control-group">
          <span className="control-label">Direction</span>
          <div className="segmented">
            <button
              type="button"
              className={direction === 'N_TO_S' ? 'active' : ''}
              onClick={() => setDirection('N_TO_S')}
            >
              N → S (Mattole → Black Sands)
            </button>
            <button
              type="button"
              className={direction === 'S_TO_N' ? 'active' : ''}
              onClick={() => setDirection('S_TO_N')}
            >
              <ArrowUpDown size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              S → N (Black Sands → Mattole)
            </button>
          </div>
        </div>
      </div>

      {/* Best Start Dates Around Selection */}
      <BestDatesStrip
        selectedStartDateStr={startDateStr}
        candidates={candidateDates}
        loading={loadingTides}
        onSelectStartDate={(ymd) => {
          setStartDateStr(ymd);
          setSelectedDayIdx(0);
        }}
      />

      {/* Main Dashboard Grid */}
      <div className="main-grid">
        {/* Left: Interactive Coastal Map */}
        <CoastalMap
          direction={direction}
          activeFromId={activeDay.fromId}
          activeToId={activeDay.toId}
          currentHeightFt={currentTideSample.heightFt}
          currentSlopeFtPerHr={currentTideSample.slopeFtPerHr}
          selectedMinutes={selectedMinutes}
          selectedDateStr={activeDateStr}
        />

        {/* Right: Tide Curve + Schedule + Permit & Checklist */}
        <div className="right-col">
          <TideChart
            dateStr={activeDateStr}
            dayNumber={activeDay.dayNumber}
            dayData={activeDayTide}
            selectedMinutes={selectedMinutes}
            onSelectMinutes={setSelectedMinutes}
            source={tideResult?.source ?? 'noaa'}
          />

          <ItinerarySchedule
            startDateStr={startDateStr}
            direction={direction}
            itinerary={itinerary}
            selectedDayIdx={selectedDayIdx}
            onSelectDay={handleSelectDay}
            onSplitDayForZone={handleSplitDayForZone}
            isCustomized={customItinerary !== null}
            onResetItinerary={() => setCustomItinerary(null)}
            tidesByDate={tideResult?.byDate ?? {}}
          />

          <div className="two-col-sub">
            <PermitPlannerCard startDateStr={startDateStr} />
            <TrailChecklistCard />
          </div>

          <AlmanacCard startDateStr={startDateStr} />
        </div>
      </div>
    </div>
  );
}

export default App;
