// SignUpForm

const SignUpForm = () => (
  <div className=" hidden md:flex absolute inset-0 backdrop-blur-[10px] justify-center z-50">
    <div className="w-[730px] bg-[rgba(76,77,86,0.8)] p-5 rounded-[20px] mt-[200px] mb-auto transform scale-100 opacity-100 transition-all duration-1000">
      <div className="flex  justify-between items-center">
        <div className="group">
          <svg
            className="hover-target"
            width="27"
            height="21"
            viewBox="0 0 27 21"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.6157 0.554364C11.2647 0.199405 10.7888 0 10.2926 0C9.79632 0 9.32039 0.199405 8.96944 0.554364L0.547888 9.0747C0.197042 9.42977 -4.95911e-05 9.91127 -4.95911e-05 10.4133C-4.95911e-05 10.9154 0.197042 11.3969 0.547888 11.752L8.96944 20.2723C9.32241 20.6172 9.79514 20.8081 10.2858 20.8037C10.7765 20.7994 11.2459 20.6003 11.5929 20.2492C11.9399 19.8982 12.1367 19.4233 12.141 18.9269C12.1452 18.4304 11.9566 17.9521 11.6157 17.595L6.54965 12.3067H24.3285C24.8248 12.3067 25.3008 12.1073 25.6518 11.7522C26.0028 11.3971 26.2 10.9155 26.2 10.4133C26.2 9.91117 26.0028 9.42958 25.6518 9.0745C25.3008 8.71941 24.8248 8.51993 24.3285 8.51993H6.54965L11.6157 3.23164C11.9665 2.87658 12.1636 2.39507 12.1636 1.893C12.1636 1.39094 11.9665 0.90943 11.6157 0.554364Z"
              fill="#DFE9F9"
            ></path>
          </svg>
        </div>
        <p className="font-semibold text-[24px] text-[#ec722b]">Sign up</p>
        <div className=" bg-transparent border w-[46px] h-[46px] flex justify-center items-center rounded-full hover:border-[#EC722B] group">
          <svg
            className="rounded-full stroke-current text-[#dfe9f9] hover-target"
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9.51887 7.50071L14.5643 2.45389C14.7006 2.32223 14.8093 2.16474 14.8841 1.9906C14.9589 1.81647 14.9983 1.62918 14.9999 1.43967C15.0016 1.25016 14.9655 1.06222 14.8937 0.886812C14.822 0.711405 14.716 0.552048 14.582 0.418038C14.448 0.284027 14.2886 0.178048 14.1132 0.106284C13.9378 0.0345195 13.7498 -0.00159292 13.5603 5.3889e-05C13.3708 0.0017007 13.1835 0.0410738 13.0094 0.115876C12.8353 0.190677 12.6778 0.29941 12.5461 0.435729L7.49929 5.48113L2.45389 0.435729C2.32223 0.29941 2.16474 0.190677 1.9906 0.115876C1.81647 0.0410738 1.62918 0.0017007 1.43967 5.3889e-05C1.25016 -0.00159292 1.06222 0.0345195 0.886812 0.106284C0.711405 0.178048 0.552048 0.284027 0.418038 0.418038C0.284027 0.552048 0.178048 0.711405 0.106284 0.886812C0.0345195 1.06222 -0.00159292 1.25016 5.3889e-05 1.43967C0.0017007 1.62918 0.0410738 1.81647 0.115876 1.9906C0.190677 2.16474 0.29941 2.32223 0.435729 2.45389L5.48113 7.49929L0.435729 12.5461C0.29941 12.6778 0.190677 12.8353 0.115876 13.0094C0.0410738 13.1835 0.0017007 13.3708 5.3889e-05 13.5603C-0.00159292 13.7498 0.0345195 13.9378 0.106284 14.1132C0.178048 14.2886 0.284027 14.448 0.418038 14.582C0.552048 14.716 0.711405 14.822 0.886812 14.8937C1.06222 14.9655 1.25016 15.0016 1.43967 14.9999C1.62918 14.9983 1.81647 14.9589 1.9906 14.8841C2.16474 14.8093 2.32223 14.7006 2.45389 14.5643L7.49929 9.51887L12.5461 14.5643C12.6778 14.7006 12.8353 14.8093 13.0094 14.8841C13.1835 14.9589 13.3708 14.9983 13.5603 14.9999C13.7498 15.0016 13.9378 14.9655 14.1132 14.8937C14.2886 14.822 14.448 14.716 14.582 14.582C14.716 14.448 14.822 14.2886 14.8937 14.1132C14.9655 13.9378 15.0016 13.7498 14.9999 13.5603C14.9983 13.3708 14.9589 13.1835 14.8841 13.0094C14.8093 12.8353 14.7006 12.6778 14.5643 12.5461L9.51887 7.50071Z"
              fill="#DFE9F9"
            ></path>
          </svg>
        </div>
      </div>
      <div className="max-w-[460px] mx-auto px-[30px] pt-[25px]">
        <p className="font-normal text-[20px] text-white leading-150 mt-5">
          Sign in or create account to quickly manage order
        </p>
        <form className="flex flex-col gap-5 mt-5">
          <div>
            <label className="cart_label" htmlFor="">
              First name
            </label>
            <div className="flex items-center border-b border-b-[#b0bcce]">
              <input className="cart_input" type="text" placeholder="One" />
            </div>
          </div>
          <div>
            <label className="cart_label" htmlFor="">
              Surname
            </label>
            <div className="flex items-center border-b border-b-[#b0bcce]">
              <input className="cart_input" type="text" placeholder="Entry" />
            </div>
          </div>
          <div>
            <label className="cart_label" htmlFor="">
              Create password
            </label>
            <div className="flex items-center border-b border-b-[#b0bcce]">
              <input className="cart_input" type="text" placeholder="******" />
              <svg
                className="ml-[-25px]"
                width="24"
                height="21"
                viewBox="0 0 24 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 1L20.5556 20M10.9587 5.89606C11.5939 5.7131 12.2683 5.70079 12.9101 5.86043C13.552 6.02007 14.1373 6.3457 14.6039 6.80271C15.0705 7.25971 15.401 7.83102 15.5601 8.45589C15.7193 9.08077 15.7012 9.73587 15.5078 10.3516M7.61222 3.23012C12.8238 0.717375 18.4374 2.74562 23 9.3125C21.7448 11.1187 20.4101 12.5817 19.0266 13.7015M15.96 15.5896C10.8707 17.7936 5.43789 15.7013 1 9.3125C2.23444 7.536 3.54589 6.09081 4.90622 4.97813"
                  stroke="white"
                  strokeOpacity="0.9"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
            </div>
          </div>
          <div>
            <label className="cart_label" htmlFor="">
              Confirm password
            </label>
            <div className="flex items-center border-b border-b-[#b0bcce]">
              <input className="cart_input" type="text" placeholder="******" />
              <svg
                className="ml-[-25px]"
                width="24"
                height="21"
                viewBox="0 0 24 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 1L20.5556 20M10.9587 5.89606C11.5939 5.7131 12.2683 5.70079 12.9101 5.86043C13.552 6.02007 14.1373 6.3457 14.6039 6.80271C15.0705 7.25971 15.401 7.83102 15.5601 8.45589C15.7193 9.08077 15.7012 9.73587 15.5078 10.3516M7.61222 3.23012C12.8238 0.717375 18.4374 2.74562 23 9.3125C21.7448 11.1187 20.4101 12.5817 19.0266 13.7015M15.96 15.5896C10.8707 17.7936 5.43789 15.7013 1 9.3125C2.23444 7.536 3.54589 6.09081 4.90622 4.97813"
                  stroke="white"
                  strokeOpacity="0.9"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
            </div>
          </div>
          <div>
            <label className="cart_label" htmlFor="">
              Your e-mail
            </label>
            <div className="flex items-center border-b border-b-[#b0bcce]">
              <input
                className="cart_input"
                type="text"
                placeholder="questions@oneentry.cloud"
              />
            </div>
          </div>
          <div>
            <label className="cart_label" htmlFor="">
              Phone number{' '}
            </label>
            <div className="border-b border-b-[#b0bcce]">
              <input
                className="cart_input"
                type="text"
                placeholder="+7 (999) 000 00 00"
              />
            </div>
          </div>
          <button className="cart_btn mb-[60px]">SIGN UP</button>
        </form>
      </div>
    </div>
  </div>
);

export default SignUpForm;
