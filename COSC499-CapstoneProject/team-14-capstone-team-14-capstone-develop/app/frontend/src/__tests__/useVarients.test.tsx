import { render } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { useVariants } from '../hooks/useVariants';
import { examAPI } from '../api/examAPI';

describe('useVariants hook', () => {
  let createdLink: any;
  let clickMock: ReturnType<typeof vi.fn>;
  let hookApi: ReturnType<typeof useVariants> | null = null;

  // keep originals
  const realCreate = document.createElement.bind(document);
  const realAppend = document.body.appendChild.bind(document.body);
  const realRemove = document.body.removeChild.bind(document.body);
  const realCreateURL = URL.createObjectURL;
  const realRevokeURL = URL.revokeObjectURL;

  // Wrapper component to mount the hook
  function HookWrapper({ examId }: { examId: number }) {
    hookApi = useVariants({ examId });
    return null;
  }

  beforeEach(() => {
    clickMock = vi.fn();
    hookApi = null;

    // stub URL methods
    URL.createObjectURL = vi.fn().mockReturnValue('blob://dummy');
    URL.revokeObjectURL = vi.fn();

    // intercept <a>
    document.createElement = ((tag: string) => {
      if (tag === 'a') {
        createdLink = {
          href: '',
          download: '',
          click: clickMock,
          remove: () => {},
        };
        return createdLink as HTMLAnchorElement;
      }
      return realCreate(tag);
    }) as any;

    // no-op appendChild/removeChild
    document.body.appendChild = ((node: any) => node) as any;
    document.body.removeChild = ((node: any) => node) as any;
  });

  afterEach(() => {
    // restore everything
    document.createElement = realCreate as any;
    document.body.appendChild = realAppend as any;
    document.body.removeChild = realRemove as any;
    URL.createObjectURL = realCreateURL;
    URL.revokeObjectURL = realRevokeURL;
    vi.restoreAllMocks();
  });

  it('downloads a .docx when one variant is passed', async () => {
    const docxBlob = new Blob(['DOCX'], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    vi.spyOn(examAPI, 'exportDocx').mockResolvedValue(docxBlob as any);
    vi.spyOn(examAPI, 'getExamDetail').mockResolvedValue({
      exam_type: 'midterm',
      course_code: 'TEST',
    } as any);

    render(<HookWrapper examId={123} />);
    await act(async () => {
      await hookApi!.exportVariants([42]);
    });

    expect(URL.createObjectURL).toHaveBeenCalledWith(docxBlob);
    expect(clickMock).toHaveBeenCalled();
    const year = new Date().getFullYear();
    expect(createdLink.download).toBe(`midterm_${year}_TEST_Variant_42.docx`);
  });

  it('downloads a .zip when no variantIds are passed', async () => {
    const zipBlob = new Blob([], { type: 'application/zip' });
    vi.spyOn(examAPI, 'exportDocx').mockResolvedValue(zipBlob as any);
    vi.spyOn(examAPI, 'getExamDetail').mockResolvedValue({
      exam_type: 'quiz',
      course_code: 'C101',
    } as any);

    render(<HookWrapper examId={456} />);
    await act(async () => {
      await hookApi!.exportVariants();
    });

    expect(URL.createObjectURL).toHaveBeenCalledWith(zipBlob);
    expect(clickMock).toHaveBeenCalled();
    const year = new Date().getFullYear();
    expect(createdLink.download).toBe(`quiz_${year}_C101_Variants.zip`);
  });
});
