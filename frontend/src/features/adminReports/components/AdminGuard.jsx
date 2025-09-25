import PropTypes from 'prop-types';
import { useIsAdmin } from '../hooks/useIsAdmin';
import '../styles/adminReports.css';

export default function AdminGuard({ children }) {
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return (
      <section className="admin-unauthorized">
        <div className="admin-unauthorized__card">
          <h2>Not authorized</h2>
          <p>You need administrative access to view this page.</p>
        </div>
      </section>
    );
  }

  return children;
}

AdminGuard.propTypes = {
  children: PropTypes.node.isRequired,
};
