import { CleanPath } from '@idl/shared';
import { Breakpoint, BreakpointEvent, Source } from '@vscode/debugadapter';
import { DebugProtocol } from '@vscode/debugprotocol';

import {
  IDL_BREAKPOINT_REGEX,
  IDLBreakpoint,
} from './idl-breakpoint-manager.interface';
import { IDLDebugAdapter } from './idl-debug-adapter.class';
import { IDebugEvaluateOptions } from './idl-debug-adapter.interface';

/**
 * Manages breakpoints for our IDL session
 */
export class IDLBreakpointManager {
  /** Breakpoints from users in VSCode */
  VSCodeBreakpoints: DebugProtocol.Breakpoint[] = [];

  /**
   * Options for when we run a command
   */
  private _options: IDebugEvaluateOptions = {
    silent: true,
    idlInfo: false,
    errorCheck: false,
  };

  constructor(private adapter: IDLDebugAdapter) {}

  /**
   * Gets current breakpoints from IDL
   *
   * Updates internal property with this as the latest
   */
  async getBreakpoints(): Promise<IDLBreakpoint[]> {
    /**
     * Get current breakpoints from IDL
     */
    const bpTable = await this.adapter.evaluate(
      'help, /breakpoints',
      this._options
    );

    /**
     * Parse output
     */
    let match = IDL_BREAKPOINT_REGEX.exec(bpTable);

    /**
     * Current breakpoints in IDL
     */
    const breakpoints: IDLBreakpoint[] = [];

    /**
     * Process all matches
     */
    while (match !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (match.index === IDL_BREAKPOINT_REGEX.lastIndex) {
        IDL_BREAKPOINT_REGEX.lastIndex++;
      }

      // get line
      const line = parseInt(match[2]);

      /**
       * Get index of our BP
       */
      const idx = parseInt(match[1]);

      // save breakpoint
      breakpoints.push({
        idx: idx,
        line: line,
        file: match[4],
      });

      // check again
      match = IDL_BREAKPOINT_REGEX.exec(bpTable);
    }

    // return what we found
    return breakpoints;
  }

  /**
   * Removes a breakpoint from IDL
   */
  async removeBreakpoint(file: string, line: number) {
    await this.adapter.evaluate(
      `breakpoint, /clear, '${CleanPath(file)}', ${line}`,
      this._options
    );
  }

  /**
   * Removes all breakpoints from IDL
   */
  async resetBreakpoints() {
    // remove all breakpoints
    for (let i = 0; i < this.VSCodeBreakpoints.length; i++) {
      await this.removeBreakpoint(
        this.VSCodeBreakpoints[i].source.path,
        this.VSCodeBreakpoints[i].line
      );
    }

    // sync breakpoints with VSCode UI
    await this.syncBreakpointState();
  }

  /**
   * Removes all breakpoints for a file
   *
   * Need to call this before setting breakpoints because, for some reason,
   * VSCode doesn't tell you when breakpoints should be removed, it just
   * tells you to add an empty array of breakpoints for a file
   */
  async resetBreakpointsForFile(file: string) {
    /** Get the current breakpoints in IDL */
    const bps = await this.getBreakpoints();

    /** Clean the path */
    const cleaned = CleanPath(file);

    // reverse
    bps.reverse();

    // find ones to remove from IDL
    for (let i = 0; i < bps.length; i++) {
      if (bps[i].file === cleaned) {
        await this.removeBreakpoint(cleaned, bps[i].line);
      }
    }
  }

  /**
   * Sets an individual breakpoint for a file and line
   *
   * Line number is one-based
   */
  private async setBreakpoint(
    file: string,
    line: number,
    sync = true
  ): Promise<void> {
    /**
     * Add breakpoint via IDL
     */
    await this.adapter.evaluate(
      `breakpoint, /set, '${CleanPath(file)}', ${line}`,
      this._options
    );

    // check if we need to sync with VSCode
    if (sync) {
      await this.syncBreakpointState();
    }
  }

  /**
   * Sets breakpoints and return set breakpoints
   */
  async setBreakpoints(
    bps: DebugProtocol.SetBreakpointsArguments
  ): Promise<DebugProtocol.Breakpoint[]> {
    // wait for IDL to start before we add them
    await this.adapter._startup;

    /** Get file */
    const file = CleanPath(bps.source.path);

    // because we might not have a path (no idea why) return if missing
    if (!file) {
      return [];
    }

    // clean up
    await this.resetBreakpointsForFile(file);

    // process each requested breakpoint
    for (let i = 0; i < bps.lines.length; i++) {
      await this.setBreakpoint(file, bps.lines[i], false);
    }

    // update our breakpoint state
    await this.syncBreakpointState();

    // return current breakpoints
    return this.VSCodeBreakpoints;
  }

  /**
   * Synchronized breakpoint state with VScode
   */
  async syncBreakpointState() {
    /**
     * Track unique breakpoints and remove duplicates
     *
     * Comes from when we actually compile a file and more than
     * one BP can end up on the same line
     */
    const uniq: { [key: string]: undefined } = {};

    /**
     * Get breakpoints from IDL
     */
    const fromIDL = await this.getBreakpoints();

    /** Current breakpoints to report to VSCode */
    const current: DebugProtocol.Breakpoint[] = [];

    // process each IDL breakpoint
    for (let i = 0; i < fromIDL.length; i++) {
      /** Make key for BP */
      const key = `${fromIDL[i].line}${fromIDL[i].file}`;

      // skip if it exists
      if (key in uniq) {
        await this.adapter.evaluate(
          `breakpoint, /clear, ${fromIDL[i].idx}`,
          this._options
        );
        continue;
      }

      // save in lookup
      uniq[key] = undefined;

      // report
      current.push(
        new Breakpoint(
          true,
          fromIDL[i].line,
          undefined,
          new Source(IDLDebugAdapter.name, fromIDL[i].file)
        )
      );
    }

    /** Get existing breakpoints */
    const removed = this.VSCodeBreakpoints;

    // remove all
    for (let i = 0; i < removed.length; i++) {
      this.adapter.sendEvent(new BreakpointEvent('removed', removed[i]));
    }

    // save
    this.VSCodeBreakpoints = current;

    // sync
    for (let i = 0; i < current.length; i++) {
      this.adapter.sendEvent(new BreakpointEvent('new', current[i]));
    }

    return current;
  }
}
