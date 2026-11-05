/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {AriaPreviewTriggerProps, usePreviewTrigger} from 'react-aria/usePreviewTrigger';
import {FocusableElement} from '@react-types/shared';
import {FocusableProvider} from 'react-aria/private/interactions/useFocusable';
import {OverlayTriggerState} from 'react-stately/useOverlayTriggerState';
import {OverlayTriggerStateContext} from './Dialog';
import {PopoverContext} from './Popover';
import {Provider} from './utils';
import React, {JSX, ReactNode, useMemo, useRef} from 'react';
import {useId} from 'react-aria/useId';
import {useTooltipTriggerState} from 'react-stately/useTooltipTriggerState';

export interface PreviewTriggerProps extends AriaPreviewTriggerProps {
  /** The trigger and Popover that make up the preview trigger. */
  children: ReactNode;
  /**
   * The delay time in milliseconds before the preview opens.
   *
   * @default 600
   */
  delay?: number;
  /**
   * The delay time in milliseconds before the preview closes.
   *
   * @default 200
   */
  closeDelay?: number;
}

/**
 * A PreviewTrigger displays a non-modal popover on hover, focus, or long press. Unlike a tooltip,
 * the popover may contain interactive content.
 */
export function PreviewTrigger(props: PreviewTriggerProps): JSX.Element {
  let state = useTooltipTriggerState({
    ...props,
    delay: props.delay ?? 600,
    closeDelay: props.closeDelay ?? 200
  });
  let triggerRef = useRef<FocusableElement>(null);
  let popoverRef = useRef<HTMLElement>(null);
  let {triggerProps, popoverProps} = usePreviewTrigger({...props, triggerRef, popoverRef}, state);
  // Label the popover by the trigger as a fallback, like DialogTrigger does. This is done here and
  // not in the hook so Popover can tell it apart from an aria-label or aria-labelledby that the app
  // passes to it directly, which should win.
  let triggerId = useId();

  // The Popover and usePopover expect an OverlayTriggerState. Adapt the TooltipTriggerState (which
  // provides the warmup/cooldown delay behavior) to that interface.
  let overlayState = useMemo<OverlayTriggerState>(
    () => ({
      isOpen: state.isOpen,
      open: () => state.open(),
      close: () => state.close(),
      setOpen: isOpen => (isOpen ? state.open() : state.close()),
      toggle: () => (state.isOpen ? state.close() : state.open()),
      point: null,
      setPoint: () => {}
    }),
    [state]
  );

  return (
    <Provider
      values={[
        [OverlayTriggerStateContext, overlayState],
        [
          PopoverContext,
          {
            trigger: 'PreviewTrigger',
            triggerRef,
            ref: popoverRef,
            isNonModal: true,
            // Skip enter/exit animations when swapping between previews during the warmup period.
            shouldSkipAnimation: state.shouldSkipAnimation,
            'aria-labelledby': triggerId,
            ...popoverProps
          }
        ]
      ]}>
      <FocusableProvider {...triggerProps} id={triggerId} ref={triggerRef}>
        {props.children}
      </FocusableProvider>
    </Provider>
  );
}
