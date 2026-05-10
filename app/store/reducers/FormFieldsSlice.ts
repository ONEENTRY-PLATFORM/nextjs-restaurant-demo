import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

type FieldType = {
  value: string;
  valid: boolean;
};

type InitialStateType = {
  fields: {
    [key: string]: FieldType;
  };
};

const initialState: InitialStateType = {
  fields: {},
};

/**
 * getFirstKey — returns the first key of an object or `undefined`.
 *
 * @param   {Record<string, FieldType>}    obj - Map of form fields keyed by marker.
 * @returns First key in iteration order, or `undefined` when the object is empty.
 */
function getFirstKey(obj: Record<string, FieldType>): string | undefined {
  const keys = Object.keys(obj);
  return keys.length > 0 ? keys[0] : undefined;
}

const formFieldsSlice = createSlice({
  name: 'form-fields',
  initialState,
  reducers: {
    addField(state, action: PayloadAction<{ [key: string]: FieldType }>) {
      const key = getFirstKey(action.payload);
      if (key) {
        const field = action.payload[key];
        if (field) {
          state.fields[key] = field;
        }
      }
    },
  },
});

export const { addField } = formFieldsSlice.actions;

export default formFieldsSlice.reducer;
