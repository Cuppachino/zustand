import create, { StateCreator, StoreApi, UseBoundStore } from 'zustand'

it('can use exposed types', () => {
  type ExampleState = {
    num: number
    numGet: () => number
    numGetState: () => number
    numSet: (v: number) => void
    numSetState: (v: number) => void
  }

  const listener = (state: ExampleState) => {
    if (state) {
      const value = state.num * state.numGet() * state.numGetState()
      state.numSet(value)
      state.numSetState(value)
    }
  }
  const selector = (state: ExampleState) => state.num
  const partial: Partial<ExampleState> = {
    num: 2,
    numGet: () => 2,
  }
  const partialFn: (state: ExampleState) => Partial<ExampleState> = (
    state
  ) => ({
    ...state,
    num: 2,
  })
  const equalityFn = (state: ExampleState, newState: ExampleState) =>
    state !== newState

  const storeApi = create<ExampleState>((set, get) => ({
    num: 1,
    numGet: () => get().num,
    numGetState: () => {
      // TypeScript can't get the type of storeApi when it trys to enforce the signature of numGetState.
      // Need to explicitly state the type of storeApi.getState().num or storeApi type will be type 'any'.
      const result: number = storeApi.getState().num
      return result
    },
    numSet: (v) => {
      set({ num: v })
    },
    numSetState: (v) => {
      storeApi.setState({ num: v })
    },
  }))
  const useBoundStore = storeApi

  const stateCreator: StateCreator<ExampleState> = (set, get) => ({
    num: 1,
    numGet: () => get().num,
    numGetState: () => get().num,
    numSet: (v) => {
      set({ num: v })
    },
    numSetState: (v) => {
      set({ num: v })
    },
  })

  function checkAllTypes(
    _getState: StoreApi<ExampleState>['getState'],
    _partialState:
      | Partial<ExampleState>
      | ((s: ExampleState) => Partial<ExampleState>),
    _setState: StoreApi<ExampleState>['setState'],
    _state: object,
    _stateListener: (state: ExampleState, previousState: ExampleState) => void,
    _stateSelector: (state: ExampleState) => number,
    _storeApi: StoreApi<ExampleState>,
    _subscribe: StoreApi<ExampleState>['subscribe'],
    _destroy: StoreApi<ExampleState>['destroy'],
    _equalityFn: (a: ExampleState, b: ExampleState) => boolean,
    _stateCreator: StateCreator<ExampleState>,
    _useBoundStore: UseBoundStore<StoreApi<ExampleState>>
  ) {
    expect(true).toBeTruthy()
  }

  checkAllTypes(
    storeApi.getState,
    Math.random() > 0.5 ? partial : partialFn,
    storeApi.setState,
    storeApi.getState(),
    listener,
    selector,
    storeApi,
    storeApi.subscribe,
    storeApi.destroy,
    equalityFn,
    stateCreator,
    useBoundStore
  )
})

type AssertEqual<Type, Expected> = Type extends Expected
  ? Expected extends Type
    ? true
    : never
  : never

it('should have correct (partial) types for setState', () => {
  type Count = { count: number }

  const store = create<Count>((set) => ({
    count: 0,
    // @ts-expect-error we shouldn't be able to set count to undefined [LATEST-TS-ONLY]
    a: () => set(() => ({ count: undefined })),
    // @ts-expect-error we shouldn't be able to set count to undefined [LATEST-TS-ONLY]
    b: () => set({ count: undefined }),
    c: () => set({ count: 1 }),
  }))

  const setState: AssertEqual<
    typeof store.setState,
    StoreApi<Count>['setState']
  > = true
  expect(setState).toEqual(true)

  // ok, should not error
  store.setState({ count: 1 })
  store.setState({})
  store.setState((previous) => previous)

  // @ts-expect-error type undefined is not assignable to type number [LATEST-TS-ONLY]
  store.setState({ count: undefined })
  // @ts-expect-error type undefined is not assignable to type number [LATEST-TS-ONLY]
  store.setState((state) => ({ ...state, count: undefined }))
})

it('should allow for different partial keys to be returnable from setState', () => {
  type State = {
    count: number
    something: string
  }

  const store = create<State>(() => ({
    count: 0,
    something: 'foo',
  }))

  const setState: AssertEqual<
    typeof store.setState,
    StoreApi<State>['setState']
  > = true
  expect(setState).toEqual(true)

  // ok, should not error
  store.setState((previous) => {
    if (previous.count === 0) {
      return { count: 1 }
    }
    return { count: 0 }
  })
  store.setState((previous) => {
    if (previous.count === 0) {
      return { count: 1 }
    }
    if (previous.count === 1) {
      return previous
    }
    return { something: 'foo' }
  })

  // @ts-expect-error Type '{ something: boolean; count?: undefined; }' is not assignable to type 'State'.
  store.setState((previous) => {
    if (previous.count === 0) {
      return { count: 1 }
    }
    return { something: true }
  })
})

it('state is covariant', () => {
  const store = create<{ count: number; foo: string }>()(() => ({
    count: 0,
    foo: '',
  }))

  const _testIsCovariant: StoreApi<{ count: number }> = store

  // @ts-expect-error should not compile
  const _testIsNotContravariant: StoreApi<{
    count: number
    foo: string
    baz: string
  }> = store
})
