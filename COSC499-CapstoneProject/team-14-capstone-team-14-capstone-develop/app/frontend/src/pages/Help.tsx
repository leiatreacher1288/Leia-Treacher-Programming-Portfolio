import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { StandardButton } from '../components/ui/StandardButton';

export const Help = () => {
  const { user } = useAuth();

  console.log(user);
  const [formData, setFormData] = useState({
    name: '',
    email: user ? user.email : '',
    message: '',
  });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Your message has been submitted!');
    setFormData({ name: '', email: '', message: '' });
  };

  const faqs = [
    {
      question: 'How do I reset my password?',
      answer:
        'Go to the login page, click on "Forgot Password", and follow the instructions. You may also reset your password in your profile page.',
    },
    {
      question: 'How can I contact an administrator?',
      answer: 'Use the contact form below, or email us at admin@example.com.',
    },
    {
      question: 'Why can’t I see my course?',
      answer:
        'Ensure you are enrolled. If the issue persists, reach out via the contact form.',
    },
    {
      question: 'How do I create a question?',
      answer:
        'Ensure that you have selected a course before creating a question.',
    },
  ];

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div
      className="fixed top-0 right-0 bottom-0 bg-white text-gray-800 font-inter overflow-y-auto"
      style={{ left: '16rem', width: 'calc(100vw - 16rem)' }}
    >
      <div className="px-8 py-10">
        <h1 className="text-heading text-2xl font-bold mb-6">User Support</h1>

        {/* FAQ Section */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900">
            Frequently Asked Questions
          </h2>
          <ul className="space-y-4">
            {faqs.map((faq, index) => (
              <li key={index} className="border-b pb-2">
                <button
                  className="w-full text-left font-semibold text-blue-800 focus:outline-none"
                  onClick={() => toggleIndex(index)}
                >
                  {faq.question}
                </button>
                {openIndex === index && (
                  <p className="mt-2 text-gray-700">{faq.answer}</p>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Form */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Contact an administrator
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="w-full p-2 border border-gray-300 rounded"
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <input
              className="w-full p-2 border border-gray-300 rounded"
              type="email"
              name="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <textarea
              className="w-full p-2 border border-gray-300 rounded"
              name="message"
              rows={5}
              placeholder="Your Message or Question"
              value={formData.message}
              onChange={handleChange}
              required
            />

            <StandardButton
              type="submit"
              color="primary-btn"
              className="px-4 py-2"
            >
              Submit
            </StandardButton>
          </form>
        </div>
      </div>
    </div>
  );
};
