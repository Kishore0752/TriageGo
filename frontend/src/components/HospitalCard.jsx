import React from 'react';
import { logHospitalClick } from '../utils/analytics';

const fmtDist = (km) => {
  if (km == null || km >= 9999) return 'N/A';
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
};

const BUSY_STYLES = {
  busy:     { dot: 'bg-red-500',   bg: 'bg-red-50',   text: 'text-red-700'   },
  moderate: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
  quiet:    { dot: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700' },
};
const OPEN_STYLES = {
  green: 'text-green-600 bg-green-50 border-green-200',
  red:   'text-red-600 bg-red-50 border-red-200',
  gray:  'text-slate-500 bg-slate-50 border-slate-200',
};

const HospitalCard = ({ item, index, selected, onToggleSelect, savedIds, onToggleSave }) => {
  const isBest  = index === 0;
  const busy    = BUSY_STYLES[item.busy_status?.status] || BUSY_STYLES.quiet;
  const openSty = OPEN_STYLES[item.open_status?.color]  || OPEN_STYLES.gray;
  const isSaved = savedIds?.has(item.id);

  return (
    <div className={`bg-white rounded-3xl border-2 transition-all duration-200 overflow-hidden
      ${isBest ? 'border-blue-500 shadow-xl shadow-blue-100' : 'border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200'}
      ${selected ? 'ring-2 ring-blue-400' : ''}`}
    >
      {/* Top badges row */}
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-2 flex-wrap">
          {isBest && (
            <span className="bg-blue-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              AI Best Match
            </span>
          )}
          {item.verified && (
            <span className="bg-emerald-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              ✓ Verified
            </span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${openSty}`}>
            {item.open_status?.label ?? 'Hours Unknown'}
          </span>
        </div>
        <button
          onClick={() => onToggleSave?.(item)}
          className={`text-xl transition-transform hover:scale-110 ${isSaved ? 'text-red-500' : 'text-slate-300'}`}
        >
          {isSaved ? '❤️' : '🤍'}
        </button>
      </div>

      <div className="p-4">
        {/* Name & Rating */}
        <div className="flex justify-between items-start mb-3 gap-3">
          <div className="flex-1">
            <h3 className="text-base font-black text-slate-900 leading-snug">{item.DiagnosticCentreName}</h3>
            <p className="text-slate-400 text-xs mt-0.5">{item.DiagnosticCentreAddress}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-2xl text-center shrink-0">
            <span className="block text-slate-900 font-black text-base">⭐ {item['Rating (out of 5)']}</span>
            <span className="text-slate-400 text-[10px]">{item['Number of Reviews']} reviews</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 mb-3 text-xs text-slate-500 flex-wrap">
          <span className="font-semibold">📍 {fmtDist(item.distance_km)}</span>
          <span className="text-slate-300">·</span>
          <span className="font-semibold">🕐 ETA {item.eta}</span>
          <span className="text-slate-300">·</span>
          <span className="font-semibold text-blue-600">AI {Math.round((item.ai_recommendation_score ?? 0) * 100)}%</span>
        </div>

        {/* Busy badge */}
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${busy.bg} ${busy.text} mb-3`}>
          <span className={`w-1.5 h-1.5 rounded-full ${busy.dot}`} />
          {item.busy_status?.label ?? 'Unknown'} · ~{item.busy_status?.wait_mins ?? '?'} min wait
        </div>

        {/* Contact Details */}
        <div className="flex items-center gap-2 mb-3 flex-wrap text-xs">
          {item.phone && item.phone !== 'N/A' && (
            <a
              href={`tel:${item.phone}`}
              onClick={() => logHospitalClick(item.id)}
              className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-semibold hover:bg-blue-100 transition-colors"
              title="Call hospital"
            >
              📞 {item.phone}
            </a>
          )}
          {item.website && item.website !== 'N/A' && item.website !== '#' && (
            <a
              href={item.website}
              target="_blank"
              rel="noreferrer"
              onClick={() => logHospitalClick(item.id)}
              className="bg-green-50 text-green-700 px-2 py-1 rounded-full font-semibold hover:bg-green-100 transition-colors"
              title="Visit website"
            >
              🌐 Website
            </a>
          )}
        </div>

        {/* Opening Hours */}
        {item.opening_hours && Array.isArray(item.opening_hours) && item.opening_hours.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-2 mb-3 text-xs text-slate-600 max-h-24 overflow-y-auto">
            <p className="font-semibold mb-1">Hours:</p>
            {item.opening_hours.slice(0, 3).map((hour, i) => (
              <div key={i} className="text-slate-500">{hour}</div>
            ))}
            {item.opening_hours.length > 3 && (
              <div className="text-slate-500 italic">+{item.opening_hours.length - 3} more days</div>
            )}
          </div>
        )}

        {/* Facility tags */}
        {item.facility_tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {item.facility_tags.map((tag, i) => (
              <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                {tag.icon} {tag.label}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-2">
          <a
            href={item.ride_links?.google_maps}
            target="_blank"
            rel="noreferrer"
            className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs text-center hover:bg-blue-600 transition-colors"
          >
            🗺️ Directions
          </a>
          <a
            href={item.ride_links?.uber}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs text-center hover:bg-black hover:text-white transition-colors"
          >
            🚗 Uber
          </a>
          <a
            href={item.ride_links?.ola}
            className="flex-1 py-2.5 bg-green-50 text-green-700 rounded-xl font-bold text-xs text-center hover:bg-green-600 hover:text-white transition-colors"
          >
            🛺 Ola
          </a>
          <button
            onClick={() => onToggleSelect?.(item)}
            className={`px-3 py-2.5 rounded-xl font-bold text-xs transition-colors ${selected ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
            title="Add to compare"
          >
            {selected ? '✓' : '⊕'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HospitalCard;