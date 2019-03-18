import React from 'react';
import { View, Dimensions, FlatList, ActivityIndicator } from 'react-native';
import AwsExports from '../../AwsExports';
import Amplify, { API, graphqlOperation } from 'aws-amplify';
import { Icon, SearchBar } from 'react-native-elements';
import * as queries from '../../src/graphql/queries';
import * as mutations from '../../src/graphql/mutations';
import UserRow from './UserRow';
import Theme from '../../Theme';

Amplify.configure(AwsExports);

var S3_URL = "https://s3-us-west-2.amazonaws.com/disneyapp3/";

export default class UserSearch extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            query: '',
            loadedQuery: '',
            users: []
        };

        this.SEARCH_DELAY = 700;
    }

    componentWillReceiveProps(newProps) {
        if (newProps.selectedUsers != this.props.selectedUsers) {
            var users = this.state.users.slice();
            for (var user of users) {
                user.selected = newProps.selectedUsers[user.id];
            }
            this.setState({
                users: users
            });
        }
    }

    onUserQueryChanged = (query) => {
        this.query = query;
        if (query.length > 0) {
            this.setState({
                query: query
            });
            setTimeout(() => {
                if (this.query == query) {
                    this.searchUsers(query);
                }
            }, this.SEARCH_DELAY);
        } else {
            this.setState({
                query: query,
                loadedQuery: query,
                users: []
            })
        }
    }

    onUserQueryCleared = () => {
        this.onUserQueryChanged("");
    }

    searchUsers = (prefix) => {
        API.graphql(graphqlOperation(queries.searchUsers, { 
            prefix: prefix
        })).then((data) => {
            var users = data.data.searchUsers;
            this.setState({
                users: users,
                loadedQuery: prefix
            });
        });
    }

    renderUser = (user) => {
        return <UserRow 
            key={user.key}
            id={user.id}
            profilePicUrl={user.profilePicUrl}
            name={user.name}
            selected={user.selected}
            onPress={this.props.onPress}
            onLongPress={this.props.onLongPress} />
    }

    render() {
        var screenHeight = Dimensions.get('window').height;
        var clearIcon = (this.state.query != null && this.state.query.length > 0)? { name: 'close', style: { width: 30, height: 30, marginLeft: 3, marginTop: -7, fontSize: 30, alignSelf: "center" } }: null;

        return (
        <View style={{ 
            flexDirection: "column",
            alignContent: 'center',
            width: '100%',
            backgroundColor: Theme.SECONDARY_BACKGROUND
        }}>
            <SearchBar 
                placeholder="Username"
                icon={{ name: 'search', style: { fontSize: 25, height: 25, marginTop: -4  } }}
                clearIcon={clearIcon}
                value={this.state.query}
                containerStyle={{
                    width: "100%",
                    height: 58,
                    backgroundColor: Theme.PRIMARY_BACKGROUND,
                    borderBottomColor: "rgba(0, 0, 0, 0.3)",
                    borderBottomWidth: 2,
                    borderTopWidth: 0
                }}
                inputStyle={{
                    marginLeft: 15,
                    paddingTop: 0,
                    paddingBottom: 0,
                    fontSize: 22,
                    color: Theme.PRIMARY_FOREGROUND
                }}
                onChangeText={this.onUserQueryChanged}
                onClearText={this.onUserQueryCleared} />
            {
                (this.state.query != this.state.loadedQuery)?
                (<ActivityIndicator size="small" />): null
            }
            <View style={{maxHeight: screenHeight * 0.4}}>
                <FlatList
                keyExtractor={(item, index) => {
                    return item.id + "--" + item.selected;
                }}
                data={this.state.users}
                renderItem={({item}) => this.renderUser(item)} />
            </View>
        </View>);
    }
};
