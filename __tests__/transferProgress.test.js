/* eslint-env jest */
import React from 'react';
import { render, screen } from '@testing-library/react';
import TransferProgress from '../src/components/TransferProgress';

describe('TransferProgress', () => {
  it('renders file name and progress', () => {
    render(
      <TransferProgress
        file={{ name: 'test.txt', size: 1024, type: 'text/plain' }}
        progress={42}
        status={"Transferring..."}
        highlight={true}
        bytesTransferred={512}
        startTime={Date.now() - 1000}
      />
    );
    expect(screen.getByText('test.txt')).toBeInTheDocument();
    expect(screen.getByText(/42%/)).toBeInTheDocument();
    expect(screen.getByText(/Transferring/)).toBeInTheDocument();
  });
});
