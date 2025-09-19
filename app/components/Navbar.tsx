import React from 'react'


export const Navbar = () => {
  return (
    <>
      {/* Mobile Navbar */}
      <div className="md:hidden p-5 mx-auto max-w-screen-xl w-full flex flex-row justify-between bg-white my-6 rounded-lg shadow-md">
        <h1>logo</h1>
        <h1>Profile</h1>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col items-center h-[90vh] w-64 bg-white rounded-lg shadow-md gap-6 lg:fixed ">
        <h1 className="">Logo</h1>
        <h1>Profile</h1>
        {/* Add more sidebar items here */}
      </div>
      
    </>
  )
}
