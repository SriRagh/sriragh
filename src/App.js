import React, { Component } from 'react'
import "./style.css";
class App extends Component {
constructor(props){
  super(props);
  this.state={
    newItem : "",
    list :[]
  }
}
updateInput(key, value){
  // update react state
  this.setState({
    [key]:value
  });
}
addItem(){
  // create item with unique ID
  const newItem={
    id:1+ Math.random(),
    value : this.state.newItem.slice()
  };
  // copy of current list of items
  const list = [...this.state.list];
  // add items to list
  list.push(newItem);
  // update state with new list and reset newItem input
  this.setState({
    list,
    newItem:""
  });
}
  deleteItem(id){
    // copy current list of items
    const list = [...this.state.list];

    // filter out item being deleted
    const updatedList = list.filter(item => item.id !== id);
    this.setState({list : updatedList})
  
}
  render() {
    return (
      <>
      <div className = "container">
        <div className = "app-title">
          <p className= "title">To Do List...</p>
          
          <input 
          className = "search"
          type = "text"
          placeholder = "Type Items here..."
          value={this.state.newItem}
          onChange={e => this.updateInput("newItem", e.target.value)}
          />

          
          <button className = "add-btn"
          onClick={() => this.addItem()}
          >Add</button>
          <br />
          <ul>
            {this.state.list.map(item => {
              return(
                <li key={item.id} className="list">
                  {item.value}
                  <button className = "btn" onClick = {() => this.deleteItem(item.id)}>X</button></li> 
              
              )
            })}
          </ul>
        </div>
        
      </div>
      </>
    )
  }

}



export default App;


