import { Component, PropsWithChildren } from 'react'
import './app.scss'

class App extends Component<PropsWithChildren<any>> {
  componentDidMount() {}

  componentDidShow() {}

  componentDidHide() {}

  render() {
    return this.props.children
  }
}

export default App
