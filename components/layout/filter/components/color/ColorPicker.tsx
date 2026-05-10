import type { Dispatch, JSX, SetStateAction } from 'react';

/**
 * ColorPicker — single color chip; clicking toggles selection by writing into `setActiveColor`.
 *
 * @param   {object}                              props                 - Component props.
 * @param   {string}                              props.code            - Color value (CSS color or marker).
 * @param   {string}                              props.name            - Human-readable color label.
 * @param   {string}                              props.activeColor     - Currently selected color code.
 * @param   {Dispatch<SetStateAction<string>>}    props.setActiveColor  - State setter that owns the selected color.
 * @returns JSX of the color chip button.
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
