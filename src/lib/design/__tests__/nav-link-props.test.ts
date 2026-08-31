/**
 * A nav link's styling and its announcement must come from the same call.
 *
 * `navLinkClass` returns only a className, so a caller could style the active
 * item and forget to say which one it is — the highlight then exists only for
 * people who can see it. AdminSidebar did exactly that on all three of its
 * link sites while every other nav surface in this app set `aria-current`
 * correctly. Four surfaces right and one wrong is what applying a rule by hand
 * looks like at the margin, so `navLinkProps` returns both together and the two
 * decisions cannot drift apart.
 */
import { navLinkClass, navLinkProps, NAV_STATE } from '@/lib/design/nav';

describe('navLinkProps', () => {
  it('announces the active link as the current page', () => {
    expect(navLinkProps('sidebar', true)['aria-current']).toBe('page');
  });

  it('leaves aria-current off inactive links rather than setting it false', () => {
    // `aria-current="false"` is a valid token meaning "not current", but it is
    // noise in the accessibility tree — omit the attribute instead.
    expect(navLinkProps('sidebar', false)['aria-current']).toBeUndefined();
  });

  it('returns exactly the className navLinkClass would have', () => {
    for (const shape of Object.keys(NAV_STATE) as (keyof typeof NAV_STATE)[]) {
      for (const active of [true, false]) {
        expect(navLinkProps(shape, active).className).toBe(navLinkClass(shape, active));
      }
    }
  });

  it('passes an extra className through unchanged', () => {
    expect(navLinkProps('sidebar', true, 'justify-center').className).toBe(
      navLinkClass('sidebar', true, 'justify-center'),
    );
  });

  it('marks the active state for every nav shape, not just the sidebar', () => {
    // The bug was one surface forgetting. A helper that only worked for the
    // shape that happened to be broken would not close the class.
    for (const shape of Object.keys(NAV_STATE) as (keyof typeof NAV_STATE)[]) {
      expect(navLinkProps(shape, true)['aria-current']).toBe('page');
    }
  });
});
