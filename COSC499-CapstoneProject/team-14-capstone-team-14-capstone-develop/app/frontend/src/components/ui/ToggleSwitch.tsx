interface Props {
  enabled: boolean;
  onToggle: () => void;
}

export const ToggleSwitch = ({ enabled, onToggle }: Props) => {
  return (
    <button
      onClick={onToggle}
      className={`relative w-12 h-7 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-btn/20
        ${
          enabled
            ? 'bg-gradient-to-r from-primary-btn to-purple-600 shadow-lg shadow-primary-btn/25'
            : 'bg-gray-300 hover:bg-gray-400 shadow-sm'
        }`}
    >
      <span
        className={`absolute top-[2px] left-[2px] w-[22px] h-[22px] bg-white rounded-full transition-all duration-300 ease-in-out shadow-md
          ${
            enabled
              ? 'translate-x-[20px] shadow-lg shadow-gray-400/30'
              : 'translate-x-0 shadow-sm'
          }`}
      />
      {/* Subtle inner glow when enabled */}
      {enabled && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-btn/20 to-purple-600/20 animate-pulse" />
      )}
    </button>
  );
};
