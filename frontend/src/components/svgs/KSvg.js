import React from "react";

const KLogoSvg = ({
  className = "w-100 h-100",
  fill = "currentColor",
  width = "auto", // Thêm prop width với giá trị mặc định
  height = "auto", // Thêm prop height với giá trị mặc định
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.0"
      // Xóa width và height cố định ở đây, sử dụng props
      width={width}
      height={height}
      viewBox="0 0 500.000000 500.000000"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      className={className}
      fill={fill}
      stroke="none"
    >
      <g transform="translate(0.000000,500.000000) scale(0.100000,-0.100000)">
        <path d="M1780 2508 c0 -652 0 -653 20 -628 11 14 62 84 113 155 52 72 132 182 178 245 46 64 104 144 129 179 25 35 63 87 85 115 49 62 179 242 254 351 30 44 60 83 65 87 6 4 75 8 154 8 107 0 142 -3 142 -12 0 -13 -56 -94 -172 -254 -32 -44 -85 -116 -118 -162 -33 -45 -60 -88 -60 -95 0 -6 19 -37 42 -67 98 -128 308 -426 308 -437 0 -10 -36 -13 -145 -13 -125 0 -147 2 -161 18 -17 19 -93 123 -137 187 -14 22 -37 53 -50 69 l-23 28 -42 -55 c-23 -31 -42 -60 -42 -65 0 -8 98 -149 190 -274 l35 -47 333 -1 c182 0 332 2 332 5 0 6 -88 130 -192 270 -105 142 -268 375 -268 383 0 4 52 79 115 167 64 88 146 203 183 255 36 52 88 124 114 159 26 35 48 68 48 72 0 5 -148 9 -328 9 l-329 0 -93 -127 c-140 -191 -240 -329 -303 -418 -55 -79 -170 -238 -202 -282 -9 -13 -20 -23 -25 -23 -6 0 -10 135 -10 350 l0 350 114 0 115 0 47 63 c26 34 51 68 57 75 7 9 -40 12 -232 12 l-241 0 0 -652z" />
      </g>
    </svg>
  );
};

export default KLogoSvg;
