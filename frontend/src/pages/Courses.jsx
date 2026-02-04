const Courses = () => {
  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold text-dark mb-6">Available Courses</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Dummy Card */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-bold">Intro to Coding</h3>
          <p className="text-gray-600 mt-2">Learn the basics of Python.</p>
          <button className="mt-4 px-4 py-2 bg-primary text-white rounded">Enroll</button>
        </div>
      </div>
    </div>
  );
};
export default Courses;