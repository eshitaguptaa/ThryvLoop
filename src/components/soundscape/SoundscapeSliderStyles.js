export default function SoundscapeSliderStyles() {
  return (
    <style jsx global>{`
      input[type='range'].slider-purple {
        -webkit-appearance: none;
        background: transparent;
      }
      input[type='range'].slider-purple::-webkit-slider-thumb {
        -webkit-appearance: none;
        height: 14px;
        width: 14px;
        border-radius: 50%;
        background: #ffffff;
        cursor: pointer;
        margin-top: -3px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
      }
      input[type='range'].slider-purple::-webkit-slider-runnable-track {
        width: 100%;
        height: 6px;
        cursor: pointer;
        border-radius: 999px;
      }
      input[type='range'].slider-purple::-moz-range-thumb {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #ffffff;
        cursor: pointer;
        border: none;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
      }
      input[type='range'].slider-purple::-moz-range-track {
        width: 100%;
        height: 6px;
        cursor: pointer;
        border-radius: 999px;
      }
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #0f0f12;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #27272a;
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #3f3f46;
      }
    `}</style>
  );
}
