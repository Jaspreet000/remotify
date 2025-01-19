"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 py-16">
      {/* Introduction Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl font-bold text-blue-700"
        >
          About <span className="text-blue-600">MyApp</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-4 text-lg text-gray-600"
        >
          MyApp is a forward-thinking platform designed to help individuals and
          businesses streamline their daily tasks with personalized tools,
          intuitive design, and innovative features.
        </motion.p>
      </section>

      {/* Our Mission Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl font-semibold text-center text-blue-700"
          >
            Our Mission
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-6 text-lg text-gray-600 text-center"
          >
            At MyApp, our mission is to empower individuals and businesses with
            cutting-edge technology that simplifies workflows, boosts
            productivity, and fosters creativity. We are committed to creating
            solutions that enhance every user&apos;s experience and deliver
            tangible results.
          </motion.p>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="bg-gradient-to-r from-blue-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl font-semibold text-blue-700"
          >
            Our Values
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-4 text-lg text-gray-600"
          >
            Our core values shape everything we do. We focus on innovation,
            integrity, and inclusivity in every solution we offer. Together, we
            aim to create an environment where creativity and efficiency thrive.
          </motion.p>

          {/* Values Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {[
              {
                title: "Innovation",
                description:
                  "Constantly seeking new ways to solve problems and improve experiences.",
                icon: "🚀",
              },
              {
                title: "Integrity",
                description:
                  "Ensuring transparency and trust in all our interactions.",
                icon: "🛡️",
              },
              {
                title: "Inclusivity",
                description:
                  "Building solutions that serve everyone, regardless of background.",
                icon: "🌍",
              },
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 * index }}
                className="p-6 bg-white shadow-lg rounded-lg hover:shadow-xl transition"
              >
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold text-blue-700">
                  {value.title}
                </h3>
                <p className="mt-2 text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl font-semibold text-center text-blue-700"
          >
            Meet Our Team
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-4 text-lg text-gray-600 text-center"
          >
            Our team is composed of experts from various fields, working
            together to bring innovation to life. Get to know the passionate
            individuals behind MyApp.
          </motion.p>

          {/* Team Members */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {[
              { name: "John Doe", role: "CEO", img: "/john-doe.jpg" },
              { name: "Jane Smith", role: "CTO", img: "/jane-smith.jpg" },
              { name: "Emma Brown", role: "COO", img: "/emma-brown.jpg" },
            ].map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 * index }}
                className="text-center"
              >
                <Image
                  src={member.img}
                  alt={member.name}
                  width={128}
                  height={128}
                  className="w-32 h-32 rounded-full mx-auto object-cover"
                />
                <h3 className="mt-4 text-xl font-semibold text-blue-700">
                  {member.name}
                </h3>
                <p className="text-lg text-gray-600">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-blue-600 py-16 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl font-bold"
          >
            Join Us on Our Journey
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-4 text-lg"
          >
            Are you passionate about innovation, technology, and making a
            difference? Join us in shaping the future of MyApp.
          </motion.p>
          <Link href="/contact">
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-8 inline-block px-8 py-3 bg-white text-blue-600 font-bold rounded-lg shadow hover:bg-gray-100"
            >
              Get in Touch
            </motion.a>
          </Link>
        </div>
      </section>
    </main>
  );
}
