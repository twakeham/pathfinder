// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock ESM-only markdown libs so Jest (CRA) can run without transforming node_modules
jest.mock('react-markdown', () => {
	const React = require('react');
	const Markdown = ({ children, ...rest }) => React.createElement('div', rest, children);
	return { __esModule: true, default: Markdown };
});

jest.mock('remark-gfm', () => ({ __esModule: true, default: () => {} }));
jest.mock('rehype-sanitize', () => ({ __esModule: true, default: () => {} }));
