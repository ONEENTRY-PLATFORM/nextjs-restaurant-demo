import type { Dispatch, JSX, SetStateAction } from 'react';

/**
 * Компонент color picker
 */
const ColorPicker = ({
  code,
  name,
  activeColor,
  setActiveColor,
}: {
  code: string;
  name: string;
  setActiveColor: Dispatch<SetStateAction<string>>;
  activeColor: string;
}): JSX.Element => {
  return (
    <button
      className={
        'flex gap-1.5 rounded-full pl-1 pr-2 transition-colors w-24 ' +
        (code === activeColor ? 'bg-brand text-white' : 'hover:bg-white/10 text-paper/80')
      }
      onClick={() => {
        if (code !== activeColor) {
          setActiveColor(code);
        } else {
          setActiveColor('');
        }
      }}
    >
      <div
        className={'my-auto size-6 rounded-full '}
        style={{
          backgroundColor: code,
        }}
      ></div>
      <span className="leading-6">{name}</span>
    </button>
  );
};

export default ColorPicker;
