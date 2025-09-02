
const FilterBottom = () => (
  <div id="side-menu" className=" fixed bottom-0 left-0 w-full bg-[rgba(76,77,86,0.8)] rounded-tl-[20px] rounded-tr-[20px] backdrop-blur-[10px] z-10 pt-[26px] px-[20px] md:hidden transform translate-y-0 transition-transform duration-1000 ease-in-out">
    <div className="max-w-[355px] mx-auto flex justify-between">
      <button className="filter_btn text-[16px] border-b border-white pb-[3px]  hover:text-[#ec722b] hover:border-[#ec722b]">Clear
        all Filters</button>
      <p className="filter_btn">Filter</p>
      <button className="filter_btn text-[#ec722b] border border-[#ec722b] rounded-[5px] px-[20px] hover_btn_white">Apply</button>
    </div>
    <div className="max-w-[355px] mx-auto flex flex-wrap mt-[37px] gap-[7px]">
      <p className="filter_title">Order waiting time</p>
      <button className="filter_item">Under 30 mins</button>
      <button className="filter_item">Under 60 mins</button>
      <button className="filter_item">doesn’t matter</button>
    </div>
    <div className="max-w-[355px] mx-auto flex flex-wrap mt-[21px] gap-[7px]">
      <p className="filter_title">Preferences</p>
      <button className="filter_item">Meat</button>
      <button className="filter_item">Fish</button>
      <button className="filter_item">Vegetable</button>
      <button className="filter_item">Sugar Free</button>
      <button className="filter_item">Gluten free</button>
      <button className="filter_item">Bland</button>
      <button className="filter_item">Law Salt</button>
      <button className="filter_item">Law Fat</button>
      <button className="filter_item">Vegetarian</button>
      <button className="filter_item">Spicy dish</button>
      <button className="filter_item">Diabetic</button>
    </div>
    <div className="max-w-[355px] mx-auto flex flex-wrap gap-[7px] mt-[21px]">
      <p className=" filter_title">Price $</p>
      <button className="filter_item">from 5</button>
      <button className="filter_item">Under 30</button>
    </div>
    <div className="h-[100px] bg-transparent border-none"></div>
  </div>
)

export default FilterBottom;
