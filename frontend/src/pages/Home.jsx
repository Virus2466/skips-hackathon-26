import {Link} from 'react-router-dom'

const Home = () => {
    return (
        <>
            <div className='flex flex-col items-center justify-center min-h-[80vh] text-center px-4'>
                <h1 className='text-5xl font-extrabold text-dark mb-6'>
                    Master New Skills <span className='text-primary'>Anytime</span>
                </h1>
                <p>
                    The best platform to learn, teach, grow. Join our hackathon project to experience the future of education.
                </p>
                <div className='flex gap-4'>
                    <Link to="/course" className='px-8 py-3 bg-primary text-black text-lg rounded-xl shadow-lg hover:bg-black transition hover:text-white transition'> 
                        Browse Courses
                    </Link>
                    <Link to="/register" className='px-8 py-3 bg-white text-primary border-2 border-primary text-lg rounded-xl hover:bg-gray-50 transition'>
                        Join as Instructor
                    </Link>
                </div>
            </div> 
        </>
    )
}

export default Home;